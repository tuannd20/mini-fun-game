# Vercel Deployment Guide

## ⚠️ Important Note: WebSocket Limitations

**Your application uses Socket.io for real-time communication, which has limitations on Vercel:**

- Vercel's serverless functions don't support persistent WebSocket connections
- Socket.io requires long-lived connections that don't work with serverless architecture
- Real-time features may not function correctly on Vercel

### Recommended Alternatives:

1. **Railway** - Full Node.js support with WebSockets
2. **Render** - Free tier with WebSocket support
3. **Heroku** - Traditional hosting with WebSocket support
4. **DigitalOcean App Platform** - Good for Node.js apps
5. **Fly.io** - Modern platform with WebSocket support

---

## If You Still Want to Deploy to Vercel

If you want to proceed with Vercel (knowing WebSockets won't work), follow these steps:

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally
   ```bash
   npm install -g vercel
   ```
3. **Git Repository**: Your project should be in a Git repository (GitHub, GitLab, or Bitbucket)

---

## Step 1: Prepare Your Project

### 1.1 Create `vercel.json` Configuration

Create a `vercel.json` file in your project root:

```json
{
	"version": 2,
	"rewrites": [
		{
			"source": "/(.*)",
			"destination": "/server.js"
		}
	]
}
```

**Note**: This uses the modern Vercel configuration without the deprecated `builds` property. Vercel will auto-detect your Node.js application.

### 1.2 Update `package.json` Scripts

Ensure your `package.json` has a build script (even if empty):

```json
{
	"scripts": {
		"start": "node server.js",
		"dev": "nodemon server.js",
		"build": "echo 'No build step required'",
		"build-css": "tailwindcss -i ./public/css/input.css -o ./public/css/style.css --watch"
	}
}
```

### 1.3 Environment Variables

You'll need to set these environment variables in Vercel:

- `MONGODB_URI` - Your MongoDB connection string
- `SESSION_SECRET` - A secure random string for session encryption
- `NODE_ENV` - Set to `production`
- `PORT` - Vercel will set this automatically (don't override)

---

## Step 2: Deploy via Vercel CLI

### 2.1 Login to Vercel

```bash
vercel login
```

### 2.2 Deploy Your Project

From your project directory:

```bash
vercel
```

Follow the prompts:

- Set up and deploy? **Yes**
- Which scope? Select your account
- Link to existing project? **No** (for first deployment)
- Project name? Enter a name or press Enter for default
- Directory? Press Enter (current directory)
- Override settings? **No**

### 2.3 Production Deployment

After the first deployment, deploy to production:

```bash
vercel --prod
```

---

## Step 3: Deploy via Vercel Dashboard (Alternative)

### 3.1 Connect Your Repository

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your Git repository
4. Select your repository from the list

### 3.2 Configure Project Settings

Since we're using the modern `vercel.json` (without `builds`), these settings in the dashboard will apply:

- **Framework Preset**: Other (or Node.js if available)
- **Root Directory**: `./` (or leave default)
- **Build Command**: Leave empty (Vercel will auto-detect Node.js)
- **Output Directory**: Leave empty
- **Install Command**: `npm install` (default)

**Note**: Without the `builds` property in `vercel.json`, Vercel will use these dashboard settings, which is the recommended approach.

### 3.3 Set Environment Variables

Go to **Settings → Environment Variables** and add:

```
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_secure_random_string
NODE_ENV=production
```

### 3.4 Deploy

Click **"Deploy"** and wait for the build to complete.

---

## Step 4: Post-Deployment Configuration

### 4.1 Update CORS and Socket.io Settings

You may need to update your Socket.io configuration for Vercel's infrastructure. However, **WebSockets will still not work** due to Vercel's serverless limitations.

### 4.2 Update Session Cookie Settings

Ensure your session cookies work with HTTPS (Vercel uses HTTPS):

```javascript
cookie: {
  secure: true, // Always true on Vercel
  sameSite: 'none', // May be needed for cross-origin
  maxAge: 24 * 60 * 60 * 1000,
}
```

---

## Step 5: Custom Domain (Optional)

1. Go to your project settings in Vercel dashboard
2. Navigate to **Domains**
3. Add your custom domain
4. Follow DNS configuration instructions

---

## Troubleshooting

### Issue: WebSockets Not Working

**Solution**: This is expected. Vercel doesn't support WebSockets. Consider migrating to Railway, Render, or another platform.

### Issue: Build Fails

- Check that all dependencies are in `dependencies` (not `devDependencies`)
- Ensure `vercel.json` is correctly configured
- Check build logs in Vercel dashboard

### Issue: Environment Variables Not Working

- Ensure variables are set in Vercel dashboard
- Redeploy after adding new environment variables
- Check variable names match exactly (case-sensitive)

### Issue: Static Files Not Loading

- Ensure `public` folder is properly configured
- Check file paths are correct
- Verify `express.static` middleware is working

---

## Recommended: Deploy to Railway Instead

Railway is better suited for your Socket.io application:

### Railway Deployment Steps:

1. **Sign up** at [railway.app](https://railway.app)
2. **Create New Project** → Deploy from GitHub
3. **Add MongoDB** service (or use external MongoDB Atlas)
4. **Set Environment Variables**:
   - `MONGODB_URI`
   - `SESSION_SECRET`
   - `NODE_ENV=production`
5. **Deploy** - Railway will auto-detect Node.js and deploy

Railway supports:

- ✅ WebSockets/Socket.io
- ✅ Persistent connections
- ✅ Long-running processes
- ✅ Free tier available

---

## Alternative: Render Deployment

1. **Sign up** at [render.com](https://render.com)
2. **New** → **Web Service**
3. **Connect** your GitHub repository
4. **Configure**:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. **Add Environment Variables**
6. **Deploy**

Render supports WebSockets on paid plans and has a free tier for testing.

---

## Summary

- ⚠️ **Vercel**: Not recommended for Socket.io apps
- ✅ **Railway**: Best free option with WebSocket support
- ✅ **Render**: Good alternative with WebSocket support
- ✅ **Heroku**: Traditional option (paid plans)
- ✅ **DigitalOcean**: Reliable with good pricing

Choose the platform that best fits your needs and budget!
