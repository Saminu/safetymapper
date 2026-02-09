# 🗺️ Lagos Safety Map - Start Here!

Welcome! You now have a complete MVP platform for dashcam data collection in Lagos.

## What You Got

A fully functional platform where drivers can:
- ✅ Register as mappers using their phones
- ✅ Stream live dashcam video from their phones
- ✅ Earn tokens based on distance and time
- ✅ Track their routes in real-time
- ✅ Withdraw earnings to bank accounts
- ✅ View network statistics

Plus a public dashboard showing:
- ✅ Live mappers on an interactive map
- ✅ Real-time network statistics
- ✅ Active sessions and routes

## Quick Start (5 Minutes)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Mapbox token:
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
   ```
   
   Get a free token at: https://account.mapbox.com

3. **Start the server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

That's it! 🎉

## Test the Platform

### Option 1: Desktop Browser
1. Go to http://localhost:3000
2. Click "BECOME A MAPPER"
3. Fill out the registration form
4. You'll be redirected to the live mapping interface
5. Grant camera and location permissions
6. Click "GO LIVE" to start earning tokens

### Option 2: Mobile Phone (Recommended)
1. Find your computer's IP address:
   ```bash
   # Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   ```

2. On your phone, visit:
   ```
   http://YOUR_IP:3000
   ```
   Example: `http://192.168.1.100:3000`

3. Follow the same steps as desktop

## Platform Structure

```
📱 Main Pages
├── /                    → Landing page with live network stats
├── /onboarding          → Driver registration
├── /live-map            → Live mapping interface (for drivers)
├── /dashboard           → Public network dashboard
└── /rewards             → Earnings and withdrawal

🔧 API Endpoints
├── /api/mappers         → Mapper management
├── /api/sessions        → Session tracking
├── /api/rewards         → Withdrawal handling
└── /api/network-stats   → Platform statistics
```

## Key Documents

- **QUICKSTART.md** - Detailed setup instructions
- **LAGOS_SAFETY_MAP.md** - Complete platform documentation
- **PLATFORM_OVERVIEW.md** - Technical architecture and roadmap
- **README.md** - Original project info + new features

## What's Next?

### For Development
1. **Add Database**: Replace in-memory storage with PostgreSQL/MongoDB
2. **Add Authentication**: Secure the platform with NextAuth.js or Clerk
3. **Integrate Payments**: Connect Paystack or Flutterwave
4. **Deploy**: Host on Vercel, Netlify, or your own server

### For Production
Check `PLATFORM_OVERVIEW.md` for the complete production checklist including:
- Database setup
- Video storage (S3/R2)
- Payment gateway integration
- Security hardening
- Mobile app development

## Current Limitations (MVP)

⚠️ **In-Memory Storage**: Data is lost when server restarts
⚠️ **No Authentication**: Anyone can create accounts
⚠️ **Local Video Storage**: Not scalable for production
⚠️ **Mock Payments**: Withdrawals are simulated

These are expected for an MVP. See production checklist for solutions.

## Features Included

### Driver Features
- [x] Mobile-first onboarding flow
- [x] Live camera feed with GPS
- [x] Real-time token accumulation
- [x] Session pause/resume
- [x] Route tracking and visualization
- [x] Earnings dashboard
- [x] Withdrawal interface
- [x] Session history

### Platform Features
- [x] Live mapper locations on map
- [x] Real-time network statistics
- [x] Active session tracking
- [x] Route visualization
- [x] Auto-refreshing dashboard
- [x] Mobile-responsive design
- [x] Dark mode optimized

### Admin/Future Features
- [ ] Admin dashboard
- [ ] Mapper verification
- [ ] Video quality scoring
- [ ] Coverage analytics
- [ ] Payment processing
- [ ] KYC integration

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Maps**: Mapbox GL JS
- **UI**: Radix UI + shadcn/ui
- **Video**: MediaRecorder API
- **Location**: Geolocation API

## Support

- 📖 Check the documentation files
- 🐛 Found a bug? Open an issue
- 💡 Have an idea? Open a discussion
- 🤝 Want to contribute? PRs welcome!

## Token Economics (MVP)

```
Base Rate: 0.5 tokens/second
Conversion: 1 token = ₦100
Example: 1 hour = 1,800 tokens = ₦180,000

With multipliers and distance bonuses,
drivers can earn ₦250,000+ per hour
```

## Testing Checklist

- [ ] Register as a mapper
- [ ] Start a live session
- [ ] See real-time stats update
- [ ] End session and view rewards
- [ ] Check dashboard shows your location
- [ ] Try withdrawal flow
- [ ] View session history

## Production Deployment

When ready to deploy:

1. **Vercel (Easiest)**:
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Docker** (see Dockerfile if included)

3. **Traditional Hosting** (VPS, etc.):
   ```bash
   npm run build
   npm start
   ```

## Environment Variables

Required:
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
```

Optional (for original AI events features):
```bash
BEE_MAPS_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
```

## Getting Help

1. Read `QUICKSTART.md` for setup help
2. Check `PLATFORM_OVERVIEW.md` for architecture details
3. Review `LAGOS_SAFETY_MAP.md` for feature documentation
4. Open an issue on GitHub

---

## You're Ready! 🚀

Your platform is built and ready to test. Start with the Quick Start section above, then explore the different pages and features.

**Happy Mapping!** 🗺️🇳🇬

---

Built for Lagos drivers, by the community.
