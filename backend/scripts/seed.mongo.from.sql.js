/* eslint-disable no-console */
// scripts/seed.mongo.from.sql.js
// Import INSERT IGNORE seed data from schema.sql + seed.sql directly into MongoDB.

const fs = require('fs');
const path = require('path');
const { connectMongo, mongoose } = require('../config/mongo');
const models = require('../models');

const TABLE_SPECS = {
  users: { model: models.User, pk: 'user_id' },
  service_providers: { model: models.ServiceProvider, pk: 'provider_id' },
  attractions: { model: models.Attraction, pk: 'attraction_id' },
  attraction_images: { model: models.AttractionImage, pk: 'image_id' },
  seasonal_availability: { model: models.SeasonalAvailability, pk: 'availability_id' },
  packages: { model: models.Package, pk: 'package_id' },
  package_attractions: { model: models.PackageAttraction, pk: 'id' },
  transport_vehicles: { model: models.TransportVehicle, pk: 'vehicle_id' },
  schedules: { model: models.Schedule, pk: 'schedule_id' },
  bookings: { model: models.Booking, pk: 'booking_id' },
  discount_rules: { model: models.DiscountRule, pk: 'rule_id' },
  payments: { model: models.Payment, pk: 'payment_id' },
  inquiries: { model: models.Inquiry, pk: 'inquiry_id' },
  inquiry_responses: { model: models.InquiryResponse, pk: 'response_id' },
  feedback: { model: models.Feedback, pk: 'feedback_id' },
  attraction_analytics: { model: models.AttractionAnalytics, pk: 'analytics_id' },
};

function splitCSVTopLevel(input) {
  const out = [];
  let cur = '';
  let inStr = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    const next = input[i + 1];

    if (ch === "'") {
      if (inStr && next === "'") {
        cur += "''";
        i += 1;
        continue;
      }
      inStr = !inStr;
      cur += ch;
      continue;
    }

    if (ch === ',' && !inStr) {
      out.push(cur.trim());
      cur = '';
      continue;
    }

    cur += ch;
  }

  if (cur.trim()) out.push(cur.trim());
  return out;
}

function parseValue(token) {
  const t = token.trim();
  if (/^NULL$/i.test(t)) return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);

  if (t.startsWith("'") && t.endsWith("'")) {
    const body = t.slice(1, -1).replace(/''/g, "'");
    return body;
  }

  return t;
}

function parseTuples(valuesBlock) {
  const tuples = [];
  let inStr = false;
  let depth = 0;
  let cur = '';

  for (let i = 0; i < valuesBlock.length; i += 1) {
    const ch = valuesBlock[i];
    const next = valuesBlock[i + 1];

    if (ch === "'") {
      if (inStr && next === "'") {
        cur += "''";
        i += 1;
        continue;
      }
      inStr = !inStr;
      cur += ch;
      continue;
    }

    if (!inStr && ch === '(') {
      depth += 1;
      if (depth === 1) {
        cur = '';
        continue;
      }
    }

    if (!inStr && ch === ')') {
      depth -= 1;
      if (depth === 0) {
        tuples.push(cur);
        cur = '';
        continue;
      }
    }

    if (depth >= 1) cur += ch;
  }

  return tuples;
}

function extractInsertBlocks(sqlText) {
  const blocks = [];
  const source = sqlText.replace(/^\s*--.*$/gm, '');
  const startRe = /INSERT\s+IGNORE\s+INTO/gim;
  let m;

  while ((m = startRe.exec(source)) !== null) {
    const start = m.index;
    let end = -1;
    let inStr = false;

    for (let i = start; i < source.length; i += 1) {
      const ch = source[i];
      const next = source[i + 1];

      if (ch === "'") {
        if (inStr && next === "'") {
          i += 1;
          continue;
        }
        inStr = !inStr;
        continue;
      }

      if (!inStr && ch === ';') {
        end = i;
        break;
      }
    }

    if (end === -1) continue;

    const stmt = source.slice(start, end + 1);
    const parsed = stmt.match(/INSERT\s+IGNORE\s+INTO\s+([a-z_]+)\s*\(([\s\S]*?)\)\s*VALUES\s*([\s\S]*);/im);
    if (!parsed) continue;

    const table = parsed[1].trim();
    const columnsRaw = parsed[2].replace(/\s+/g, ' ');
    const cols = splitCSVTopLevel(columnsRaw).map((c) => c.replace(/`/g, '').trim());
    const valuesRaw = parsed[3];
    const tuples = parseTuples(valuesRaw).map((tuple) => splitCSVTopLevel(tuple).map(parseValue));
    blocks.push({ table, cols, tuples });

    startRe.lastIndex = end + 1;
  }

  return blocks;
}

async function importBlock(block) {
  const spec = TABLE_SPECS[block.table];
  if (!spec) {
    console.log(`- skip ${block.table} (no model mapping)`);
    return { table: block.table, inserted: 0, skipped: block.tuples.length };
  }

  const { model, pk } = spec;
  const hasPkColumn = block.cols.includes(pk);
  let inserted = 0;
  let skipped = 0;

  let seq = 0;
  if (!hasPkColumn) {
    const top = await model.findOne({}, { [pk]: 1 }).sort({ [pk]: -1 }).lean();
    seq = Number(top?.[pk] || 0);
  }

  for (const tuple of block.tuples) {
    const doc = {};
    for (let i = 0; i < block.cols.length; i += 1) {
      doc[block.cols[i]] = tuple[i] === undefined ? null : tuple[i];
    }

    if (doc[pk] == null) {
      if (!hasPkColumn) {
        seq += 1;
        doc[pk] = seq;
      } else {
        skipped += 1;
        continue;
      }
    }

    try {
      // Emulate INSERT IGNORE semantics.
      const res = await model.updateOne(
        { [pk]: doc[pk] },
        { $setOnInsert: doc },
        { upsert: true }
      );
      inserted += res.upsertedCount || 0;
    } catch (err) {
      // Duplicate unique-key error behaves like INSERT IGNORE (skip row).
      if (err && err.code === 11000) {
        skipped += 1;
        continue;
      }
      throw err;
    }
  }

  return { table: block.table, inserted, skipped };
}

async function recalcRatings() {
  const providerAgg = await models.Feedback.aggregate([
    { $match: { target_type: 'Provider' } },
    { $group: { _id: '$target_id', avg_r: { $avg: '$rating' }, cnt: { $sum: 1 } } },
  ]);

  for (const row of providerAgg) {
    await models.ServiceProvider.updateOne(
      { provider_id: row._id },
      { $set: { average_rating: Number(row.avg_r.toFixed(2)), rating_count: row.cnt } }
    );
  }

  const attractionAgg = await models.Feedback.aggregate([
    { $match: { target_type: 'Attraction' } },
    { $group: { _id: '$target_id', avg_r: { $avg: '$rating' }, cnt: { $sum: 1 } } },
  ]);

  for (const row of attractionAgg) {
    await models.Attraction.updateOne(
      { attraction_id: row._id },
      { $set: { average_rating: Number(row.avg_r.toFixed(2)), rating_count: row.cnt } }
    );
  }
}

(async () => {
  try {
    await connectMongo();

    // Reset mapped collections so seeding is deterministic.
    for (const spec of Object.values(TABLE_SPECS)) {
      await spec.model.deleteMany({});
    }

    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');

    // Include schema admin seed + all seed.sql inserts.
    const blocks = [
      ...extractInsertBlocks(schemaSQL),
      ...extractInsertBlocks(seedSQL),
    ];

    const summary = [];
    for (const block of blocks) {
      const result = await importBlock(block);
      summary.push(result);
      console.log(`- ${result.table}: tuples ${block.tuples.length}, inserted ${result.inserted}, skipped ${result.skipped}`);
    }

    await recalcRatings();

    console.log('\nSeed import complete.');
    const totalInserted = summary.reduce((s, x) => s + x.inserted, 0);
    console.log(`Total inserted: ${totalInserted}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed import failed:', err.message || err);
    if (err.stack) console.error(err.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
})();
