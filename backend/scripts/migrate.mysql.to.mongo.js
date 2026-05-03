/* eslint-disable no-console */
// scripts/migrate.mysql.to.mongo.js
// One-time migration: MySQL -> MongoDB

require('dotenv').config();
const mysql = require('mysql2/promise');
const { connectMongo, mongoose } = require('../config/mongo');
const modelsIndex = require('../models/index');
const models = modelsIndex;

const TABLES = [
  { table: 'users', model: models.User, pk: 'user_id' },
  { table: 'service_providers', model: models.ServiceProvider, pk: 'provider_id' },
  { table: 'attractions', model: models.Attraction, pk: 'attraction_id' },
  { table: 'attraction_images', model: models.AttractionImage, pk: 'image_id' },
  { table: 'seasonal_availability', model: models.SeasonalAvailability, pk: 'availability_id' },
  { table: 'packages', model: models.Package, pk: 'package_id' },
  { table: 'package_attractions', model: models.PackageAttraction, pk: 'id' },
  { table: 'transport_vehicles', model: models.TransportVehicle, pk: 'vehicle_id' },
  { table: 'schedules', model: models.Schedule, pk: 'schedule_id' },
  { table: 'bookings', model: models.Booking, pk: 'booking_id' },
  { table: 'discount_rules', model: models.DiscountRule, pk: 'rule_id' },
  { table: 'payments', model: models.Payment, pk: 'payment_id' },
  { table: 'inquiries', model: models.Inquiry, pk: 'inquiry_id' },
  { table: 'inquiry_responses', model: models.InquiryResponse, pk: 'response_id' },
  { table: 'feedback', model: models.Feedback, pk: 'feedback_id' },
  { table: 'attraction_analytics', model: models.AttractionAnalytics, pk: 'analytics_id' },
];

function toPlain(doc) {
  const out = {};
  for (const [k, v] of Object.entries(doc)) {
    if (v === null || v === undefined) {
      out[k] = v;
      continue;
    }
    if (typeof v === 'bigint') {
      out[k] = Number(v);
      continue;
    }
    out[k] = v;
  }
  return out;
}

async function migrateTable(pool, spec) {
  const { table, model, pk } = spec;

  const [rows] = await pool.query(`SELECT * FROM ${table}`);
  if (!rows.length) {
    console.log(`- ${table}: no rows`);
    return { table, count: 0 };
  }

  const ops = rows.map((r) => {
    const row = toPlain(r);
    return {
      updateOne: {
        filter: { [pk]: row[pk] },
        update: { $set: row },
        upsert: true,
      },
    };
  });

  await model.bulkWrite(ops, { ordered: false });
  console.log(`- ${table}: migrated ${rows.length}`);
  return { table, count: rows.length };
}

(async () => {
  let mysqlPool;
  let currentTable = null;
  try {
    await connectMongo();

    mysqlPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tourism_db',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      timezone: '+00:00',
    });

    console.log('Starting migration...');

    const summary = [];
    for (const spec of TABLES) {
      currentTable = spec.table;
      const res = await migrateTable(mysqlPool, spec);
      summary.push(res);
    }

    const total = summary.reduce((s, x) => s + x.count, 0);
    console.log('\\nMigration complete.');
    summary.forEach((x) => console.log(`${x.table}: ${x.count}`));
    console.log(`TOTAL ROWS: ${total}`);

    await mysqlPool.end();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed at table:', currentTable || 'startup');
    console.error('Message:', err && err.message ? err.message : '(no message)');
    console.error('Code:', err && err.code ? err.code : '(no code)');
    if (err && err.sqlMessage) console.error('SQL:', err.sqlMessage);
    if (err && err.stack) console.error(err.stack);
    if (mysqlPool) await mysqlPool.end();
    await mongoose.disconnect();
    process.exit(1);
  }
})();

