# Vercel Deployment with Socket.IO Setup Guide

## Overview

This project has been configured for deployment on Vercel with Socket.IO support. The configuration prioritizes polling transport for better compatibility with Vercel's serverless architecture.

## Domain Configuration

The production domain is set to: **mini-fun-game.vercel.app**

## Environment Variables

Set these environment variables in your Vercel project settings:

1. **MONGODB_URI** - Your MongoDB connection string
2. **SESSION_SECRET** - A secure random string for session encryption
3. **NODE_ENV** - Set to `production`
4. **PRODUCTION_DOMAIN** (optional) - Defaults to `mini-fun-game.vercel.app`

## Deployment Steps

### 1. Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy to Vercel

From your project directory:

```bash
vercel
```

For production deployment:

```bash
vercel --prod
```

### 4. Set Environment Variables

In Vercel Dashboard:
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add the required variables listed above

### 5. Redeploy

After setting environment variables, redeploy:

```bash
vercel --prod
```

## Socket.IO Configuration

### Current Setup

- **Transport Priority**: Polling first (better for serverless), then WebSocket
- **CORS**: Configured for production domain
- **Session**: Configured for HTTPS with secure cookies

### Important Notes

1. **Serverless Limitations**: Vercel's serverless functions have limitations with persistent WebSocket connections. The current setup uses polling transport which works better with serverless architecture.

2. **Performance**: Polling transport may have slightly higher latency than WebSockets, but it's more reliable on serverless platforms.

3. **Scaling**: The current setup should work for moderate traffic. For high-traffic applications, consider:
   - Using a separate Socket.IO service (Railway, Render, etc.)
   - Using Vercel's Edge Functions if WebSocket support becomes available
   - Using a dedicated server for Socket.IO

## Troubleshooting

### Socket.IO Connection Issues

If Socket.IO connections fail:

1. **Check CORS settings**: Ensure the production domain is correctly set
2. **Check environment variables**: Verify all required variables are set
3. **Check transport**: The client will automatically fallback to polling if WebSocket fails
4. **Check browser console**: Look for connection errors

### Session Issues

If sessions aren't working:

1. **Check SESSION_SECRET**: Must be set in environment variables
2. **Check cookie settings**: Ensure `secure` and `sameSite` are correct for HTTPS
3. **Check domain**: Ensure cookies are set for the correct domain

### Database Connection Issues

If database connections fail:

1. **Check MONGODB_URI**: Verify the connection string is correct
2. **Check MongoDB Atlas**: Ensure your IP is whitelisted (or use 0.0.0.0/0 for Vercel)
3. **Check connection timeout**: Vercel functions have execution time limits

## Alternative: Separate Socket.IO Service

If you need better WebSocket support, consider deploying Socket.IO to a separate service:

### Option 1: Railway (Recommended)

1. Create a separate Socket.IO server
2. Deploy to Railway (free tier available)
3. Update client to connect to Railway URL
4. Configure CORS on Railway server

### Option 2: Render

1. Deploy Socket.IO server to Render
2. Use Render's WebSocket support
3. Update client configuration

## Testing

After deployment:

1. Visit `https://mini-fun-game.vercel.app`
2. Open browser DevTools → Network tab
3. Check for Socket.IO connection (look for `/socket.io/` requests)
4. Verify real-time features work correctly

## Support

For issues or questions:
- Check Vercel logs: `vercel logs`
- Check browser console for client-side errors
- Verify all environment variables are set correctly

