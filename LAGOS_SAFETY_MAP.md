# Lagos Safety Map - MVP Platform

A mobile-first platform for drivers in Lagos to provide dashcam data using their phones, inspired by Hivemapper's safety mapping concept.

## Overview

Lagos Safety Map enables drivers (taxi, okada, danfo, etc.) to monetize their daily routes by streaming live video from their smartphones. The platform creates a real-time safety network that helps navigate Lagos streets more safely.

## Features

### For Mappers (Drivers)

- **Mobile Onboarding** - Simple registration flow for drivers
- **Live Mapping Interface** - Real-time video recording with GPS tracking
- **Auto-Calibration** - Automatic horizon calibration for optimal video quality
- **Token Rewards** - Earn tokens based on distance, time, and coverage
- **Instant Withdrawals** - Cash out tokens to Nigerian bank accounts
- **Session Tracking** - View mapping history and earnings

### For Network

- **Live Map Dashboard** - Real-time view of active mappers across Lagos
- **Network Statistics** - Total mappers, active streams, grid coverage
- **Route Visualization** - See live routes being mapped
- **Video Verification** - Proof of mapping through video evidence

## Platform Structure

```
/                    - Landing page with Safety Map interface
/onboarding          - Driver registration and info
/live-map            - Mobile mapping interface (for drivers)
/dashboard           - Live network dashboard (public view)
/rewards             - Mapper rewards and withdrawal
```

## Vehicle Types Supported

- Taxi (Max Rides)
- Okada (Motorcycle)
- Danfo Bus
- Bolt/Uber
- Keke Napep (Tricycle)
- Box Truck
- Private Car
- Other

## Token System

- Mappers earn tokens in real-time while driving
- 1 Token = ₦100
- Bonus multipliers for:
  - Unmapped areas (Blind Spots): 10x
  - Peak hours (7-9 AM, 5-7 PM): 2x
  - Daily consistency bonuses
  - Quality video footage

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Maps**: Mapbox GL JS
- **Video**: MediaRecorder API (WebRTC)
- **Geolocation**: Browser Geolocation API
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + shadcn/ui

## API Endpoints

### Mappers
- `POST /api/mappers` - Register new mapper
- `GET /api/mappers` - Get all mappers (with filters)

### Sessions
- `POST /api/sessions` - Start mapping session
- `GET /api/sessions` - Get sessions (by mapper, status)
- `PATCH /api/sessions/[id]` - Update session
- `POST /api/sessions/[id]/location` - Update location during session
- `POST /api/sessions/upload` - Upload session video

### Rewards
- `POST /api/rewards/withdraw` - Initiate withdrawal
- `GET /api/rewards/withdraw` - Get withdrawal history

### Network
- `GET /api/network-stats` - Get network statistics

## Getting Started

### Prerequisites

- Node.js 18+
- A Mapbox access token ([Get one here](https://account.mapbox.com))
- Modern browser with camera and GPS support

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-event-videos.git
cd ai-event-videos
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Mapbox token:
```
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Mobile Setup

### For Drivers

1. Visit the platform on your mobile browser
2. Navigate to `/onboarding` to register
3. Grant camera and location permissions
4. Mount your phone securely in your vehicle
5. Go to `/live-map` and tap "GO LIVE" to start earning

### Recommended Phone Mounting

- Use a sturdy handlebar or dashboard mount
- Ensure camera has clear view of road ahead
- Position at eye level if possible
- Secure cables to avoid interference

## Data Storage (MVP)

Currently uses in-memory storage for quick MVP deployment. For production:

- Replace in-memory Maps with a database (PostgreSQL, MongoDB)
- Implement video storage (AWS S3, Cloudflare R2)
- Add authentication (NextAuth.js, Clerk)
- Integrate payment gateway (Paystack, Flutterwave)

## Production Considerations

### Security
- [ ] Add authentication and authorization
- [ ] Implement rate limiting
- [ ] Validate and sanitize all inputs
- [ ] Secure API endpoints
- [ ] Encrypt sensitive data

### Video Processing
- [ ] Implement video compression
- [ ] Add CDN for video delivery
- [ ] Create thumbnail generation
- [ ] Set up video analytics
- [ ] Implement quality scoring

### Payments
- [ ] Integrate Nigerian payment gateway (Paystack/Flutterwave)
- [ ] Add KYC verification
- [ ] Implement withdrawal limits
- [ ] Set up transaction monitoring
- [ ] Add fraud detection

### Scalability
- [ ] Set up database with proper indexing
- [ ] Implement caching (Redis)
- [ ] Use message queue for async tasks
- [ ] Set up load balancing
- [ ] Monitor performance

### Mobile App
- [ ] Build native iOS/Android apps (React Native)
- [ ] Implement background location tracking
- [ ] Add offline mode
- [ ] Push notifications
- [ ] App store deployment

## Network Statistics

Track these key metrics:
- Total Mappers
- Active Mappers (currently live)
- Verified Streams
- Total Paid (NGN)
- Total Distance Mapped (km)
- Grid Confidence (%)

## Future Enhancements

- AI event detection (harsh braking, potholes, etc.)
- Social features (leaderboards, achievements)
- Route recommendations
- Safety alerts
- Community reporting
- Integration with navigation apps
- Insurance partnerships
- Fleet management features

## Contributing

This is an MVP platform. Contributions welcome for:
- Database integration
- Payment gateway setup
- Mobile app development
- Video processing optimization
- Testing and documentation

## License

MIT

## Support

For issues or questions, please open a GitHub issue.

---

Built for Lagos drivers, by the community. 🇳🇬
