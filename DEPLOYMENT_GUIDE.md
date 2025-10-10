# 🚀 Advanced Voice Processor - Deployment Guide

This guide provides multiple deployment options for your Advanced Voice Processor application, from simple cloud hosting to enterprise-grade solutions.

## 📋 **Prerequisites**

- ✅ Git repository: [https://github.com/Kunj-Mori/Voice-Processor.git](https://github.com/Kunj-Mori/Voice-Processor.git)
- ✅ GitHub account with repository access
- ✅ Domain name (optional, for custom domains)
- ✅ SSL certificate (for production)

---

## 🌐 **Deployment Options**

### **Option 1: Vercel (Recommended for Frontend) + Railway (Backend)**

#### **Frontend Deployment on Vercel**

1. **Go to [Vercel.com](https://vercel.com)**
2. **Sign up/Login** with GitHub
3. **Import Project**:
   - Click "New Project"
   - Select "Kunj-Mori/Voice-Processor"
   - Choose "frontend" as root directory
4. **Configure Build Settings**:
   - Framework Preset: `Create React App`
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`
5. **Environment Variables**:
   ```
   REACT_APP_BACKEND_URL=https://your-backend-url.railway.app
   ```
6. **Deploy**: Click "Deploy"

#### **Backend Deployment on Railway**

1. **Go to [Railway.app](https://railway.app)**
2. **Sign up/Login** with GitHub
3. **New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose "Kunj-Mori/Voice-Processor"
   - Set root directory to `backend`
4. **Configure Environment**:
   - Add environment variables in Railway dashboard
   - Set `PORT=8000`
   - Add other variables from `.env`
5. **Deploy**: Railway will automatically deploy

---

### **Option 2: Netlify (Frontend) + Heroku (Backend)**

#### **Frontend Deployment on Netlify**

1. **Go to [Netlify.com](https://netlify.com)**
2. **Sign up/Login** with GitHub
3. **New Site from Git**:
   - Click "New site from Git"
   - Choose GitHub
   - Select "Kunj-Mori/Voice-Processor"
   - Set base directory to `frontend`
4. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `build`
5. **Environment Variables**:
   - Go to Site settings > Environment variables
   - Add `REACT_APP_BACKEND_URL=https://your-heroku-app.herokuapp.com`
6. **Deploy**: Click "Deploy site"

#### **Backend Deployment on Heroku**

1. **Install Heroku CLI**:
   ```bash
   # Windows
   winget install Heroku.HerokuCLI
   
   # Or download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login to Heroku**:
   ```bash
   heroku login
   ```

3. **Create Heroku App**:
   ```bash
   cd backend
   heroku create your-voice-processor-backend
   ```

4. **Configure Environment Variables**:
   ```bash
   heroku config:set HOST=0.0.0.0
   heroku config:set PORT=8000
   heroku config:set DEBUG=False
   ```

5. **Deploy**:
   ```bash
   git subtree push --prefix=backend heroku main
   ```

---

### **Option 3: DigitalOcean App Platform**

#### **Full-Stack Deployment**

1. **Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)**
2. **Create New App**:
   - Click "Create App"
   - Connect GitHub account
   - Select "Kunj-Mori/Voice-Processor"
3. **Configure Components**:

   **Frontend Component**:
   - Source Directory: `frontend`
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - Environment Variables:
     ```
     REACT_APP_BACKEND_URL=https://your-backend-url
     ```

   **Backend Component**:
   - Source Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Run Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - Environment Variables:
     ```
     HOST=0.0.0.0
     PORT=8080
     DEBUG=False
     ```

4. **Deploy**: Click "Create Resources"

---

### **Option 4: AWS (Advanced)**

#### **Frontend on AWS S3 + CloudFront**

1. **Create S3 Bucket**:
   ```bash
   aws s3 mb s3://your-voice-processor-frontend
   ```

2. **Build and Upload**:
   ```bash
   cd frontend
   npm run build
   aws s3 sync build/ s3://your-voice-processor-frontend --delete
   ```

3. **Configure CloudFront**:
   - Create CloudFront distribution
   - Set S3 as origin
   - Configure custom domain (optional)

#### **Backend on AWS Elastic Beanstalk**

1. **Install EB CLI**:
   ```bash
   pip install awsebcli
   ```

2. **Initialize EB**:
   ```bash
   cd backend
   eb init
   eb create production
   ```

3. **Deploy**:
   ```bash
   eb deploy
   ```

---

### **Option 5: Docker Deployment**

#### **Create Dockerfile for Backend**

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### **Create Dockerfile for Frontend**

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

RUN yarn build

FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### **Create docker-compose.yml**

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - HOST=0.0.0.0
      - PORT=8000
      - DEBUG=False
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      - REACT_APP_BACKEND_URL=http://localhost:8000
    depends_on:
      - backend
```

#### **Deploy with Docker**

```bash
# Build and run
docker-compose up --build

# Or deploy to cloud
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔧 **Environment Configuration**

### **Production Environment Variables**

#### **Backend (.env)**
```env
# Production Settings
HOST=0.0.0.0
PORT=8000
DEBUG=False

# CORS Settings
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com

# Audio Processing
SAMPLE_RATE=16000
CHUNK_SIZE=1024
CHANNELS=1

# Logging
LOG_LEVEL=INFO
```

#### **Frontend (.env)**
```env
# Production Backend URL
REACT_APP_BACKEND_URL=https://your-backend-domain.com

# Build Settings
GENERATE_SOURCEMAP=false
FAST_REFRESH=false
```

---

## 🚀 **Quick Deployment Commands**

### **Vercel + Railway (Recommended)**

```bash
# 1. Deploy Backend to Railway
# - Go to railway.app
# - Connect GitHub repo
# - Set root directory to 'backend'
# - Add environment variables

# 2. Deploy Frontend to Vercel
# - Go to vercel.com
# - Connect GitHub repo
# - Set root directory to 'frontend'
# - Add REACT_APP_BACKEND_URL environment variable

# 3. Update Frontend with Backend URL
# - In Vercel dashboard, add environment variable:
#   REACT_APP_BACKEND_URL=https://your-railway-backend-url.railway.app
```

### **Netlify + Heroku**

```bash
# 1. Deploy Backend to Heroku
cd backend
heroku create your-voice-processor-backend
heroku config:set HOST=0.0.0.0 PORT=8000 DEBUG=False
git subtree push --prefix=backend heroku main

# 2. Deploy Frontend to Netlify
# - Go to netlify.com
# - Connect GitHub repo
# - Set base directory to 'frontend'
# - Add REACT_APP_BACKEND_URL environment variable
```

---

## 🔍 **Post-Deployment Checklist**

### **✅ Backend Verification**
- [ ] Backend is accessible at deployed URL
- [ ] API endpoints respond correctly
- [ ] WebSocket connection works
- [ ] Audio processing functions properly
- [ ] CORS is configured correctly

### **✅ Frontend Verification**
- [ ] Frontend loads without errors
- [ ] Can connect to backend API
- [ ] All features work (Live Mode, Recording, etc.)
- [ ] File uploads work
- [ ] Real-time audio processing works

### **✅ Security Checklist**
- [ ] HTTPS is enabled
- [ ] Environment variables are secure
- [ ] CORS is properly configured
- [ ] No sensitive data in client code
- [ ] API rate limiting (if needed)

---

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **CORS Errors**
```javascript
// Backend: Update CORS settings
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
```

#### **Environment Variables Not Loading**
- Check variable names (must start with `REACT_APP_` for frontend)
- Restart deployment after adding variables
- Verify variable values in deployment dashboard

#### **WebSocket Connection Failed**
- Check if WebSocket URL is correct
- Verify backend supports WebSockets
- Check firewall settings

#### **Audio Processing Issues**
- Ensure backend has sufficient resources
- Check audio file format support
- Verify microphone permissions

---

## 📊 **Monitoring & Analytics**

### **Recommended Tools**
- **Vercel Analytics**: Built-in performance monitoring
- **Railway Metrics**: Backend performance monitoring
- **Sentry**: Error tracking and monitoring
- **Google Analytics**: User analytics

### **Health Checks**
```bash
# Backend health check
curl https://your-backend-url.com/api/

# Frontend health check
curl https://your-frontend-url.com/
```

---

## 🎯 **Recommended Deployment Strategy**

### **For Beginners: Vercel + Railway**
- ✅ Easy setup
- ✅ Automatic deployments
- ✅ Built-in monitoring
- ✅ Free tiers available

### **For Production: DigitalOcean App Platform**
- ✅ Full-stack deployment
- ✅ Better performance
- ✅ More control
- ✅ Professional features

### **For Enterprise: AWS**
- ✅ Maximum scalability
- ✅ Advanced security
- ✅ Custom configurations
- ✅ Enterprise support

---

## 🚀 **Next Steps After Deployment**

1. **Set up custom domain** (optional)
2. **Configure SSL certificates**
3. **Set up monitoring and alerts**
4. **Implement CI/CD pipeline**
5. **Add error tracking**
6. **Set up backups**
7. **Configure scaling policies**

---

**🎉 Your Advanced Voice Processor is now ready for production!**

Choose the deployment option that best fits your needs and follow the step-by-step instructions above.
