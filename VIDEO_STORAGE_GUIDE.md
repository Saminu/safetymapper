# Video Storage Guide

## Current Limitation (MVP on Vercel)

**Problem:** Videos are not persisted after upload

**Why:** Vercel's serverless functions have a read-only filesystem. Any files written during a function execution are lost when the function completes.

## What Works Now:

✅ Video recording in the browser  
✅ Session tracking (distance, duration, tokens)  
✅ Mapper location and routes  
✅ Session metadata storage  
❌ Permanent video storage  

## Production Solution: Cloud Storage

To enable permanent video storage, integrate cloud storage:

### Option 1: AWS S3 (Recommended)

```bash
npm install aws-sdk
```

Update `/api/sessions/upload/route.ts`:

```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const video = formData.get("video") as File;
  const sessionId = formData.get("sessionId") as string;
  
  const buffer = Buffer.from(await video.arrayBuffer());
  const filename = `sessions/${sessionId}.webm`;
  
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: filename,
    Body: buffer,
    ContentType: "video/webm",
  }));
  
  const videoUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${filename}`;
  
  // Update session with video URL
  const session = sessions.get(sessionId);
  if (session) {
    session.videoUrl = videoUrl;
    sessions.set(sessionId, session);
  }
  
  return NextResponse.json({ success: true, videoUrl });
}
```

### Option 2: Cloudflare R2 (S3-compatible, cheaper)

```bash
npm install @aws-sdk/client-s3
```

Same code as S3, but use R2 endpoint:

```typescript
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
```

### Option 3: Uploadthing (Easiest)

```bash
npm install uploadthing @uploadthing/react
```

See: https://uploadthing.com/

### Option 4: Vercel Blob (Integrated with Vercel)

```bash
npm install @vercel/blob
```

```typescript
import { put } from '@vercel/blob';

const blob = await put(`sessions/${sessionId}.webm`, video, {
  access: 'public',
});

const videoUrl = blob.url;
```

## Environment Variables Needed:

```env
# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET_NAME=your-bucket

# or Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET_NAME=your-bucket

# or Vercel Blob
BLOB_READ_WRITE_TOKEN=your_token
```

## Cost Comparison:

| Service | Storage Cost | Bandwidth Cost | Free Tier |
|---------|--------------|----------------|-----------|
| **AWS S3** | $0.023/GB | $0.09/GB | 5GB storage, 20K requests |
| **Cloudflare R2** | $0.015/GB | **FREE** | 10GB storage |
| **Vercel Blob** | $0.15/GB | $0.15/GB | 500MB |
| **Uploadthing** | Free tier | Free tier | 2GB |

## Recommended for Lagos Safety Map:

**Cloudflare R2** - Best value for video storage:
- ✅ No egress fees (free bandwidth)
- ✅ S3-compatible API
- ✅ 10GB free tier
- ✅ Low storage costs

## Quick Setup for R2:

1. Create Cloudflare account
2. Go to R2 → Create bucket
3. Generate API token
4. Add environment variables to Vercel
5. Update upload route code
6. Deploy!

Cost for 1000 mappers with 10GB video/month: ~$15/month

---

For now, the platform works perfectly for tracking sessions, routes, and earnings. Videos can be added when you're ready to deploy to production!
