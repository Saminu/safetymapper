# Quick Start Guide - Lagos Safety Map

Get your Safety Map platform running in 5 minutes.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Mapbox token:
```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
```

Get a free Mapbox token at: https://account.mapbox.com

## Step 3: Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Step 4: Test the Platform

### As a Visitor
1. Visit http://localhost:3000 - See the Safety Map homepage
2. Click "VIEW MAPPER GRID" to see the live dashboard

### As a Mapper (Driver)
1. Click "BECOME A MAPPER" or visit http://localhost:3000/onboarding
2. Fill out the registration form:
   - Name: Your name
   - Phone: Your phone number
   - Vehicle Type: Select your vehicle
   - Accept terms and conditions
3. Click "JOIN NETWORK"
4. You'll be redirected to the live mapping interface at `/live-map`

### Test Live Mapping
1. On the `/live-map` page:
   - Allow camera access when prompted
   - Allow location access when prompted
   - Wait for GPS lock (green location indicator)
   - Click "GO LIVE" to start a mapping session
2. Watch your stats update in real-time:
   - Duration counter
   - Distance mapped
   - Tokens earned
3. Click "END SESSION" when done

### View Your Rewards
1. Visit http://localhost:3000/rewards (or add link in your app)
2. See your token balance and session history
3. Test withdrawal flow

## Platform URLs

- **Homepage**: http://localhost:3000
- **Onboarding**: http://localhost:3000/onboarding
- **Live Map** (Driver Interface): http://localhost:3000/live-map
- **Dashboard** (Public View): http://localhost:3000/dashboard
- **Rewards**: http://localhost:3000/rewards

## Mobile Testing

To test on your phone:

1. Find your computer's local IP address:
   ```bash
   # Mac/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```

2. Update `next.config.ts` if needed to allow external access

3. Visit from your phone:
   ```
   http://YOUR_IP:3000
   ```
   Example: `http://192.168.1.100:3000`

4. Accept camera and GPS permissions on mobile

## Key Features to Test

### 1. Mapper Registration
- ✅ Register with different vehicle types
- ✅ Form validation
- ✅ Terms acceptance

### 2. Live Mapping
- ✅ Camera initialization
- ✅ GPS tracking
- ✅ Horizon calibration animation
- ✅ Real-time stats (duration, distance, tokens)
- ✅ Pause/resume functionality
- ✅ Session completion

### 3. Live Dashboard
- ✅ View all registered mappers
- ✅ See live mappers on map
- ✅ Network statistics
- ✅ Real-time updates (auto-refresh every 5 seconds)

### 4. Rewards System
- ✅ View token balance
- ✅ Session history
- ✅ Withdrawal simulation

## Data Storage (MVP Note)

The MVP uses **in-memory storage**, which means:
- ✅ Fast and simple for testing
- ⚠️ Data is lost when server restarts
- ⚠️ Not suitable for production

For production, you'll need to:
1. Set up a database (PostgreSQL, MongoDB, etc.)
2. Implement video storage (S3, R2, etc.)
3. Add authentication
4. Integrate payment gateway

## Troubleshooting

### Camera not working
- Check browser permissions
- Ensure you're on HTTPS or localhost
- Try a different browser (Chrome works best)

### GPS not locking
- Make sure you're outdoors or near a window
- Check browser location permissions
- Wait 30-60 seconds for GPS to acquire

### Mapbox map not loading
- Verify your `NEXT_PUBLIC_MAPBOX_TOKEN` is set correctly
- Check browser console for errors
- Ensure you have internet connection

### Video recording fails
- Check available disk space
- Verify camera permissions
- Use a modern browser (Chrome, Edge, Safari)

## Next Steps

1. **Customize Branding**: Update colors, logo, and text
2. **Add Database**: Implement persistent storage
3. **Set Up Payment**: Integrate Paystack or Flutterwave
4. **Add Authentication**: Secure the platform
5. **Deploy**: Host on Vercel, Netlify, or your server

## Need Help?

- Check `LAGOS_SAFETY_MAP.md` for detailed documentation
- Review the original `README.md` for framework details
- Open an issue on GitHub

---

Happy Mapping! 🗺️🇳🇬
