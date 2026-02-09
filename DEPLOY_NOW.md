# Deploy Lagos Safety Map to Vercel (Free)

## Option 1: Deploy via Vercel CLI (Fastest - 2 minutes)

1. Open a new terminal and run:
```bash
cd /Users/simba/Documents/Klar/ai-event-videos
npx vercel
```

2. Follow the prompts:
   - Login/signup to Vercel (free account)
   - Confirm project settings (just press Enter for defaults)
   - It will deploy automatically!

3. Add your environment variable:
```bash
npx vercel env add NEXT_PUBLIC_MAPBOX_TOKEN
```
Enter: `pk.eyJ1Ijoic2FtaW5hdGVkIiwiYSI6ImNrMWxubHpzYzA3M2UzbnBndWUwb3ppN24ifQ._2rGOvc6XcU9HgHnypPopQ`

4. Redeploy with environment variable:
```bash
npx vercel --prod
```

You'll get a live URL like: `https://your-project.vercel.app`

---

## Option 2: Deploy via GitHub + Vercel Web (3 minutes)

1. **Push to GitHub:**
```bash
cd /Users/simba/Documents/Klar/ai-event-videos
git remote -v  # Check your remote
git push origin main  # Or: git push
```

2. **Go to Vercel:**
   - Visit https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repo
   - Add environment variable:
     - Key: `NEXT_PUBLIC_MAPBOX_TOKEN`
     - Value: `pk.eyJ1Ijoic2FtaW5hdGVkIiwiYSI6ImNrMWxubHpzYzA3M2UzbnBndWUwb3ppN24ifQ._2rGOvc6XcU9HgHnypPopQ`
   - Click "Deploy"

Done! You'll get a live URL.

---

## Option 3: Deploy to Netlify (Alternative, also free)

1. **Install Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Deploy:**
```bash
cd /Users/simba/Documents/Klar/ai-event-videos
netlify deploy --prod
```

3. **Add environment variable in Netlify dashboard**

---

## What You'll Get

A live URL like:
- `https://lagos-safety-map.vercel.app` (Vercel)
- `https://lagos-safety-map.netlify.app` (Netlify)

Anyone can visit and test:
- ✅ View the landing page
- ✅ Register as a mapper
- ✅ Test the live mapping interface
- ✅ See the dashboard

---

## Recommended: Option 1 (npx vercel)

It's the fastest and doesn't require pushing to GitHub first.

Just run:
```bash
cd /Users/simba/Documents/Klar/ai-event-videos && npx vercel
```

Let me know which option you'd like help with!
