# Tourism App Login Fix - TODO Steps

## ✅ Step 1: Config Updated
IP='192.168.56.1', PORT='5051'
  - New API_BASE_URL: http://192.168.56.1:5000/api/v1

## ✅ Step 2: Start Backend Server
```
Server running on http://192.168.56.1:5051/api ✓
```

```
cd backend
npm install
npm start
```
- Expected: MongoDB connect, server on http://0.0.0.0:5000
- Test: Open http://localhost:5000/api/health

## ⏳ Step 3: Create Test User
```
cd backend
node scripts/create-test-user.js
```
- Creds: test@example.com / test123Test

## ⏳ Step 4: Test Login in Expo Go
- Restart Metro: `npx expo start --clear`
- Login with test@example.com / test123Test
- Ensure phone & PC on same WiFi, firewall allows port 5000

## ⏳ Step 5: If Still Network Error (Physical Device)
```
npm install -g ngrok  # if not installed
npx ngrok http 5000
```
- Copy ngrok HTTPS URL, temp update env.js API_BASE_URL='https://abc.ngrok.io/api/v1'

## Status: Ready for Steps 2-5

Copy-paste these commands to your VSCode terminal one by one.
