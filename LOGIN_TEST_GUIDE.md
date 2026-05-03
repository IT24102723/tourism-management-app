# 🔐 Login Test Guide

## ✅ Backend Status
- **Server:** Running on `http://localhost:5051`
- **Database:** MongoDB Connected ✅
- **Health Check:** http://localhost:5051/api/health

---

## 📱 Test Login Credentials

### Primary Test User
```
📧 Email:    test@example.com
🔐 Password: test123Test
```

---

## 🚀 How to Test

### Step 1: Ensure Backend is Running
```bash
cd "backend"
npm run dev
```
Expected output:
```
✅ MongoDB connected successfully
🚀 Tourism Support System API
   Listening on: http://localhost:5051
```

### Step 2: Start Mobile App
```bash
cd "mobile-app"
npm start
```

### Step 3: Login with Test Credentials
1. **Email:** `test@example.com`
2. **Password:** `test123Test`
3. **Tap "Login"** → Should succeed! ✅

---

## 🛠️ Platform-Specific Configuration

### Android Emulator
- API uses: `http://10.0.2.2:5051/api/v1`
- This automatically reaches your host machine

### iOS Simulator
- API uses: `http://localhost:5051/api/v1`
- This works on the same machine

### Physical Device Testing
To test on a physical device (Android/iOS):

1. **Find your machine's local IP:**
   - Windows: Run `ipconfig` in terminal, look for "IPv4 Address"
   - Mac/Linux: Run `ifconfig`
   - Example: `192.168.1.100`

2. **Update `mobile-app/src/services/api.js`:**
   ```javascript
   const LOCAL_MACHINE_IP = '192.168.1.100'; // Your actual IP
   ```

3. **Update backend CORS in `.env`:**
   ```
   CLIENT_ORIGIN=http://192.168.1.100:5051
   ```

---

## 🐛 Troubleshooting

### Error: "Connection failed - ensure backend is running"
- ✅ Check if backend server is running on port 5051
- ✅ Verify MongoDB connection
- ✅ Run: `npm run dev` in backend directory

### Error: "Invalid email or password"
- ✅ Use exact credentials: `test@example.com` / `test123Test`
- ✅ Check password has uppercase, lowercase, and number

### Cannot reach backend from device
- ✅ Ensure backend is on same network as device
- ✅ Use correct IP address (not localhost or 127.0.0.1)
- ✅ Check firewall isn't blocking port 5051

---

## 📊 Database Status

### Test User Created
- **user_id:** 1001+ (auto-generated)
- **Status:** Active ✅
- **Role:** Tourist

### Sample Data Available
- 8 Attractions
- 6 Tour Packages
- 3 Service Providers
- All ready for testing

---

## 🔄 Create Additional Test Users

Run this command to add more test users:
```bash
cd "backend"
node scripts/create-test-user.js
```

Modify the script to create users with different credentials.

---

**Status:** ✅ All systems operational and ready for testing!
