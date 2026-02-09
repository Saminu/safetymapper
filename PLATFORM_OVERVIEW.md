# Lagos Safety Map - Platform Overview

## 🎯 What We Built

A complete MVP platform that transforms Lagos drivers into paid safety mappers using only their smartphones. Think Hivemapper, but mobile-first and built for Lagos.

## 📱 Core User Flows

### 1. Driver Onboarding Journey
```
Landing Page → "Become a Mapper" → Registration Form → Live Map Interface
```

**What happens:**
- Driver sees compelling stats and "How to Map" guide
- Fills out simple form (name, phone, vehicle type)
- Gets instant mapper ID stored in browser
- Redirected to live mapping interface

### 2. Active Mapping Session
```
Mount Phone → Grant Permissions → Go Live → Earn Tokens → End Session
```

**What happens:**
- Camera activates and shows road view
- GPS tracks location in real-time
- Tokens accumulate every second
- Route is recorded and visualized
- Video is uploaded on session end

### 3. Rewards & Withdrawal
```
View Balance → Request Withdrawal → Enter Bank Details → Cash Out
```

**What happens:**
- See total tokens earned and conversion to NGN
- View complete session history
- Initiate withdrawal to bank account
- Track withdrawal status

## 🗺️ Platform Pages

### Homepage (`/`)
**Purpose:** Marketing and network showcase
- Hero section with live mapper count
- Real-time network statistics
- Animated background map showing active mappers
- "How to Map" educational content
- CTA to become mapper or explore grid

### Onboarding (`/onboarding`)
**Purpose:** Convert visitors to active mappers
- Two-step flow: Intro → Registration
- Vehicle type selection
- Terms acceptance
- Mobile-optimized form

### Live Map (`/live-map`)
**Purpose:** Main driver interface for earning
- Full-screen camera view
- Real-time GPS tracking
- Session controls (start, pause, end)
- Live earnings counter
- Distance and duration tracking
- Visual grid overlay for calibration

### Dashboard (`/dashboard`)
**Purpose:** Public view of network activity
- Interactive map of Lagos with live mappers
- Real-time mapper locations and routes
- Network statistics (mappers, distance, earnings)
- List view of all mappers with status
- Auto-refreshes every 5 seconds

### Rewards (`/rewards`)
**Purpose:** Driver earnings management
- Token balance display
- NGN conversion (1 token = ₦100)
- Withdrawal interface
- Session history with earnings breakdown
- Tips for maximizing earnings

## 🔧 Technical Architecture

### Frontend (Next.js 16)
```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── onboarding/page.tsx        # Driver registration
│   ├── live-map/page.tsx          # Mapping interface
│   ├── dashboard/page.tsx         # Network dashboard
│   ├── rewards/page.tsx           # Earnings management
│   └── api/                       # API routes
│       ├── mappers/               # Mapper CRUD
│       ├── sessions/              # Session management
│       ├── rewards/               # Withdrawal handling
│       └── network-stats/         # Statistics
├── components/
│   ├── map/
│   │   ├── mapper-map.tsx        # Mapbox with live mappers
│   │   └── events-map.tsx        # Original events map
│   └── ui/                       # Reusable components
├── types/
│   ├── mapper.ts                 # Mapper types
│   └── events.ts                 # Original event types
└── lib/                          # Utilities
```

### API Endpoints

**Mappers**
- `POST /api/mappers` - Register new mapper
- `GET /api/mappers` - List mappers (filter by status, isLive)
- `GET /api/mappers/[id]` - Get specific mapper
- `PATCH /api/mappers/[id]` - Update mapper

**Sessions**
- `POST /api/sessions` - Start mapping session
- `GET /api/sessions` - List sessions (filter by mapper, status)
- `GET /api/sessions/[id]` - Get specific session
- `PATCH /api/sessions/[id]` - Update session (complete, pause)
- `POST /api/sessions/[id]/location` - Update real-time location
- `POST /api/sessions/upload` - Upload video file

**Rewards**
- `POST /api/rewards/withdraw` - Request withdrawal
- `GET /api/rewards/withdraw` - Get withdrawal history

**Network**
- `GET /api/network-stats` - Get platform statistics

### Data Models

**Mapper**
```typescript
{
  id: string
  name: string
  phone: string
  email?: string
  vehicleType: VehicleType
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  totalEarnings: number
  totalDistance: number
  isLive: boolean
  currentLocation?: { lat, lon }
}
```

**MappingSession**
```typescript
{
  id: string
  mapperId: string
  status: "ACTIVE" | "PAUSED" | "COMPLETED"
  startLocation: { lat, lon }
  route: Array<{ lat, lon, timestamp, speed }>
  distance: number (km)
  duration: number (minutes)
  tokensEarned: number
  videoUrl?: string
}
```

## 💰 Token Economics (MVP)

### Earning Rates
- **Base Rate**: 0.5 tokens/second while active
- **Distance Bonus**: Additional tokens for km covered
- **Quality Multipliers** (future):
  - Unmapped areas: 10x
  - Peak hours: 2x
  - Consistent daily mapping: +20%

### Conversion
- 1 Token = ₦100 (Nigerian Naira)
- Instant withdrawal to bank accounts
- Minimum withdrawal: 10 tokens (₦1,000)

### Example Earnings
- 1 hour session = 1,800 tokens = ₦180,000 base
- 20 km covered = +1,000 tokens = ₦100,000
- **Total: ~₦280,000 per hour** (with multipliers)

## 🎨 Design System

### Colors
- **Primary**: Orange (#f97316) - Action, earnings, live status
- **Background**: Black/Dark gray - Professional, map-friendly
- **Success**: Green - Completed, verified
- **Warning**: Yellow - Paused, attention needed
- **Danger**: Red - Live indicator, stop actions

### Typography
- **Headings**: Bold, uppercase for impact
- **Body**: Clear, readable for mobile
- **Stats**: Large, bold numbers
- **Labels**: Small, uppercase, muted

## 📊 Key Features

### Real-Time Features
✅ Live GPS tracking with 1-second updates
✅ Real-time token accumulation
✅ Live route visualization on map
✅ Active mapper count and locations
✅ Network stats auto-refresh

### Mobile-First
✅ Camera access via MediaRecorder API
✅ Geolocation tracking
✅ Touch-optimized controls
✅ Responsive design
✅ Offline-capable (future)

### Gamification
✅ Real-time earnings counter
✅ Session statistics
✅ Historical performance
✅ Earning tips and multipliers
✅ Leaderboards (future)

## 🚀 Deployment Checklist

### MVP (Current State)
- [x] In-memory data storage
- [x] Browser-based video recording
- [x] Local file uploads
- [x] No authentication
- [ ] Database integration
- [ ] Cloud video storage
- [ ] Payment gateway
- [ ] User authentication

### Production Requirements

**Infrastructure**
- [ ] PostgreSQL or MongoDB database
- [ ] AWS S3 or Cloudflare R2 for videos
- [ ] Redis for caching and real-time updates
- [ ] Message queue (RabbitMQ, SQS) for async tasks

**Security**
- [ ] JWT authentication
- [ ] API rate limiting
- [ ] Input validation and sanitization
- [ ] HTTPS everywhere
- [ ] Video encryption at rest

**Payments**
- [ ] Paystack or Flutterwave integration
- [ ] KYC verification
- [ ] Bank account validation
- [ ] Transaction monitoring
- [ ] Fraud detection

**Mobile App**
- [ ] React Native apps (iOS/Android)
- [ ] Background location tracking
- [ ] Offline mode
- [ ] Push notifications
- [ ] In-app wallet

**Analytics**
- [ ] User tracking (Mixpanel, Amplitude)
- [ ] Video quality scoring
- [ ] Coverage heat maps
- [ ] Earnings analytics
- [ ] Mapper retention metrics

## 🎯 Success Metrics

### North Star Metric
**Active Mapping Hours per Week**

### Key Metrics
- Daily Active Mappers (DAM)
- Average Session Duration
- Coverage Area (km²)
- Token Payout Rate
- Mapper Retention (D7, D30)
- Video Quality Score
- GPS Accuracy

### Target KPIs (Month 1)
- 100+ registered mappers
- 50+ active daily mappers
- 1,000+ km mapped
- 95%+ GPS accuracy
- 90%+ video quality

## 🔮 Future Roadmap

### Phase 1: Foundation (Complete ✅)
- [x] Core mapping functionality
- [x] Basic rewards system
- [x] Live dashboard
- [x] Mobile-responsive UI

### Phase 2: Production Ready (Next)
- [ ] Database integration
- [ ] Payment gateway
- [ ] Authentication system
- [ ] Video storage optimization
- [ ] Performance monitoring

### Phase 3: Enhanced Features
- [ ] AI event detection (potholes, traffic, etc.)
- [ ] Route recommendations
- [ ] Social features (leaderboards, teams)
- [ ] Insurance partnerships
- [ ] Fleet management tools

### Phase 4: Scale
- [ ] Expand to other Nigerian cities
- [ ] Native mobile apps
- [ ] Offline mapping capability
- [ ] Advanced analytics dashboard
- [ ] API for third-party integrations

## 🛠️ Development Setup

See `QUICKSTART.md` for step-by-step setup instructions.

**Quick Commands:**
```bash
npm install              # Install dependencies
npm run dev             # Start dev server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run linter
```

## 📝 Notes

### Current Limitations (MVP)
1. **In-Memory Storage**: Data lost on server restart
2. **No Authentication**: Anyone can create mappers
3. **Local Video Storage**: Not scalable
4. **Mock Payments**: Withdrawal is simulated
5. **No Validation**: Minimal input validation

### Known Issues
1. Video upload may fail for long sessions (>1GB)
2. GPS accuracy varies by device and environment
3. Camera calibration is visual only (no actual correction)
4. Token calculation is simplified (real system needs more factors)

## 🤝 Contributing

This is an MVP. Priority areas for contribution:
1. Database schema design and implementation
2. Payment gateway integration (Paystack)
3. Video compression and optimization
4. Mobile app development
5. Testing and documentation

## 📄 License

MIT License - See LICENSE file

---

Built with ❤️ for Lagos drivers
