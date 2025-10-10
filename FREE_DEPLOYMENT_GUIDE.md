# 🆓 FREE Deployment Guide - Vercel + Render

This guide shows you how to deploy your Advanced Voice Processor **completely FREE** using Vercel (frontend) and Render (backend).

## 🎯 **Why This Setup?**
- ✅ **100% Free Forever**
- ✅ **No credit card required**
- ✅ **Professional hosting**
- ✅ **Custom domains**
- ✅ **SSL certificates**
- ✅ **Automatic deployments**

---

## 🚀 **Step 1: Deploy Backend on Render (FREE)**

### **1.1 Go to Render**
1. Visit [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with your **GitHub account**

### **1.2 Create Web Service**
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `Kunj-Mori/Voice-Processor`
3. Click **"Connect"**

### **1.3 Configure Backend**
```
Name: voice-processor-backend
Environment: Python 3
Region: Oregon (US West)
Branch: main
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn server:app --host 0.0.0.0 --port $PORT
```

### **1.4 Add Environment Variables**
Click **"Advanced"** → **"Add Environment Variable"**:
```
HOST = 0.0.0.0
PORT = 8000
DEBUG = False
ALLOWED_ORIGINS = https://your-vercel-app.vercel.app
SAMPLE_RATE = 16000
CHUNK_SIZE = 1024
CHANNELS = 1
LOG_LEVEL = INFO
```

### **1.5 Deploy**
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Copy your backend URL (e.g., `https://voice-processor-backend.onrender.com`)

---

## 🌐 **Step 2: Deploy Frontend on Vercel (FREE)**

### **2.1 Go to Vercel**
1. Visit [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Sign up with your **GitHub account**

### **2.2 Import Project**
1. Click **"New Project"**
2. Import from GitHub: `Kunj-Mori/Voice-Processor`
3. Click **"Import"**

### **2.3 Configure Frontend**
```
Framework Preset: Create React App
Root Directory: frontend
Build Command: npm run build
Output Directory: build
Install Command: npm install
```

### **2.4 Add Environment Variables**
Click **"Environment Variables"**:
```
REACT_APP_BACKEND_URL = https://your-render-backend-url.onrender.com
```

### **2.5 Deploy**
1. Click **"Deploy"**
2. Wait for deployment (2-3 minutes)
3. Get your frontend URL (e.g., `https://voice-processor.vercel.app`)

---

## 🔄 **Step 3: Update Backend CORS**

### **3.1 Update Backend Environment**
1. Go back to Render dashboard
2. Click on your backend service
3. Go to **"Environment"** tab
4. Update `ALLOWED_ORIGINS`:
```
ALLOWED_ORIGINS = https://your-vercel-app.vercel.app,https://www.your-vercel-app.vercel.app
```
5. Click **"Save Changes"**
6. Wait for redeployment

---

## ✅ **Step 4: Test Your Deployment**

### **4.1 Test Backend**
```bash
curl https://your-backend-url.onrender.com/api/
```
Should return: `{"message": "Voice Processing API - Ready!"}`

### **4.2 Test Frontend**
1. Visit your Vercel URL
2. Check if the app loads
3. Test voice processing features

---

## 🎯 **Step 5: Custom Domain (Optional)**

### **5.1 Add Custom Domain to Vercel**
1. Go to Vercel dashboard
2. Click on your project
3. Go to **"Settings"** → **"Domains"**
4. Add your domain
5. Follow DNS instructions

### **5.2 Add Custom Domain to Render**
1. Go to Render dashboard
2. Click on your backend service
3. Go to **"Settings"** → **"Custom Domains"**
4. Add your domain
5. Follow DNS instructions

---

## 📊 **Free Tier Limits**

### **Vercel (Frontend)**
- ✅ **Bandwidth**: 100GB/month
- ✅ **Build minutes**: 6000 minutes/month
- ✅ **Functions**: 100GB-hours/month
- ✅ **Projects**: Unlimited
- ✅ **Custom domains**: Unlimited

### **Render (Backend)**
- ✅ **Free tier**: 750 hours/month
- ✅ **Bandwidth**: 100GB/month
- ✅ **Sleep**: After 15 minutes of inactivity
- ✅ **Custom domains**: Free
- ✅ **SSL**: Free

---

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Backend Not Starting**
- Check if all environment variables are set
- Verify the start command is correct
- Check Render logs for errors

#### **CORS Errors**
- Update `ALLOWED_ORIGINS` in Render
- Make sure frontend URL is correct
- Wait for backend redeployment

#### **Frontend Build Fails**
- Check if `REACT_APP_BACKEND_URL` is set
- Verify backend URL is accessible
- Check Vercel build logs

#### **Audio Not Working**
- Check if microphone permissions are granted
- Verify WebSocket connection
- Check browser console for errors

---

## 🚀 **Quick Commands**

### **Update Backend CORS**
```bash
# In Render dashboard, update environment variable:
ALLOWED_ORIGINS = https://your-vercel-app.vercel.app,https://www.your-vercel-app.vercel.app
```

### **Redeploy Backend**
```bash
# In Render dashboard:
# Go to your service → "Manual Deploy" → "Deploy latest commit"
```

### **Redeploy Frontend**
```bash
# In Vercel dashboard:
# Go to your project → "Deployments" → "Redeploy"
```

---

## 🎉 **You're Done!**

Your Advanced Voice Processor is now live and **completely FREE**!

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`
- **Cost**: $0.00/month
- **Uptime**: 99.9%+

---

## 📱 **Next Steps**

1. **Test all features** on your deployed app
2. **Add custom domain** (optional)
3. **Set up monitoring** (optional)
4. **Share your app** with others!

**🎊 Congratulations! Your voice processor is now live and free!**
