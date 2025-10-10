@echo off
echo 🆓 FREE Deployment Guide - Advanced Voice Processor
echo ==================================================
echo.
echo This will deploy your app COMPLETELY FREE using:
echo - Vercel (Frontend) - FREE FOREVER
echo - Render (Backend) - FREE FOREVER
echo.
echo No credit card required!
echo.

echo Press any key to start...
pause >nul

echo.
echo 🚀 STEP 1: Deploy Backend on Render
echo ===================================
echo.
echo 1. Go to https://render.com
echo 2. Click "Get Started for Free"
echo 3. Sign up with GitHub
echo 4. Click "New +" → "Web Service"
echo 5. Connect repository: Kunj-Mori/Voice-Processor
echo 6. Configure:
echo    - Name: voice-processor-backend
echo    - Environment: Python 3
echo    - Root Directory: backend
echo    - Build Command: pip install -r requirements.txt
echo    - Start Command: uvicorn server:app --host 0.0.0.0 --port $PORT
echo.
echo 7. Add Environment Variables:
echo    - HOST = 0.0.0.0
echo    - PORT = 8000
echo    - DEBUG = False
echo    - ALLOWED_ORIGINS = https://your-vercel-app.vercel.app
echo.
echo 8. Click "Create Web Service"
echo 9. Wait for deployment (5-10 minutes)
echo 10. COPY YOUR BACKEND URL (e.g., https://voice-processor-backend.onrender.com)
echo.

echo Press any key when backend is deployed...
pause >nul

echo.
echo 🌐 STEP 2: Deploy Frontend on Vercel
echo ====================================
echo.
echo 1. Go to https://vercel.com
echo 2. Click "Sign Up"
echo 3. Sign up with GitHub
echo 4. Click "New Project"
echo 5. Import: Kunj-Mori/Voice-Processor
echo 6. Configure:
echo    - Framework: Create React App
echo    - Root Directory: frontend
echo    - Build Command: npm run build
echo    - Output Directory: build
echo.
echo 7. Add Environment Variable:
echo    - REACT_APP_BACKEND_URL = [YOUR RENDER BACKEND URL]
echo.
echo 8. Click "Deploy"
echo 9. Wait for deployment (2-3 minutes)
echo 10. COPY YOUR FRONTEND URL (e.g., https://voice-processor.vercel.app)
echo.

echo Press any key when frontend is deployed...
pause >nul

echo.
echo 🔄 STEP 3: Update Backend CORS
echo ==============================
echo.
echo 1. Go back to Render dashboard
echo 2. Click on your backend service
echo 3. Go to "Environment" tab
echo 4. Update ALLOWED_ORIGINS:
echo    - ALLOWED_ORIGINS = https://your-vercel-app.vercel.app,https://www.your-vercel-app.vercel.app
echo 5. Click "Save Changes"
echo 6. Wait for redeployment
echo.

echo Press any key when CORS is updated...
pause >nul

echo.
echo ✅ STEP 4: Test Your App
echo ========================
echo.
echo 1. Visit your Vercel frontend URL
echo 2. Test voice processing features
echo 3. Check if everything works
echo.

echo 🎉 CONGRATULATIONS!
echo ===================
echo.
echo Your Advanced Voice Processor is now live and FREE!
echo.
echo Frontend: https://your-app.vercel.app
echo Backend:  https://your-backend.onrender.com
echo Cost:     $0.00/month
echo.
echo For detailed instructions, see FREE_DEPLOYMENT_GUIDE.md
echo.
pause
