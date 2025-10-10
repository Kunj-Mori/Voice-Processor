@echo off
echo 🚀 Advanced Voice Processor - Quick Deployment Script
echo ==================================================

echo.
echo Choose deployment option:
echo 1. Vercel + Railway (Recommended)
echo 2. Netlify + Heroku
echo 3. DigitalOcean App Platform
echo 4. Docker Local
echo 5. Exit

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto vercel_railway
if "%choice%"=="2" goto netlify_heroku
if "%choice%"=="3" goto digitalocean
if "%choice%"=="4" goto docker_local
if "%choice%"=="5" goto exit
goto invalid

:vercel_railway
echo.
echo 🌐 Vercel + Railway Deployment
echo ==============================
echo.
echo 1. Backend (Railway):
echo    - Go to https://railway.app
echo    - Sign up with GitHub
echo    - Click "New Project"
echo    - Select "Deploy from GitHub repo"
echo    - Choose "Kunj-Mori/Voice-Processor"
echo    - Set root directory to "backend"
echo    - Add environment variables
echo.
echo 2. Frontend (Vercel):
echo    - Go to https://vercel.com
echo    - Sign up with GitHub
echo    - Click "New Project"
echo    - Select "Kunj-Mori/Voice-Processor"
echo    - Set root directory to "frontend"
echo    - Add REACT_APP_BACKEND_URL environment variable
echo.
echo 3. Update Frontend with Backend URL:
echo    - Copy your Railway backend URL
echo    - Add to Vercel environment variables:
echo      REACT_APP_BACKEND_URL=https://your-railway-url.railway.app
echo.
goto end

:netlify_heroku
echo.
echo 🌐 Netlify + Heroku Deployment
echo ==============================
echo.
echo 1. Backend (Heroku):
echo    - Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
echo    - Run: heroku login
echo    - Run: heroku create your-voice-processor-backend
echo    - Run: heroku config:set HOST=0.0.0.0 PORT=8000 DEBUG=False
echo    - Run: git subtree push --prefix=backend heroku main
echo.
echo 2. Frontend (Netlify):
echo    - Go to https://netlify.com
echo    - Sign up with GitHub
echo    - Click "New site from Git"
echo    - Choose "Kunj-Mori/Voice-Processor"
echo    - Set base directory to "frontend"
echo    - Add REACT_APP_BACKEND_URL environment variable
echo.
goto end

:digitalocean
echo.
echo 🌐 DigitalOcean App Platform
echo ============================
echo.
echo 1. Go to https://cloud.digitalocean.com/apps
echo 2. Click "Create App"
echo 3. Connect GitHub account
echo 4. Select "Kunj-Mori/Voice-Processor"
echo 5. Configure components:
echo    - Frontend: Source Directory = "frontend"
echo    - Backend: Source Directory = "backend"
echo 6. Add environment variables
echo 7. Click "Create Resources"
echo.
goto end

:docker_local
echo.
echo 🐳 Docker Local Deployment
echo ==========================
echo.
echo 1. Install Docker Desktop
echo 2. Run: docker-compose up --build
echo 3. Access at http://localhost:3000
echo.
goto end

:invalid
echo.
echo ❌ Invalid choice. Please enter 1-5.
echo.
goto end

:exit
echo.
echo 👋 Goodbye!
echo.
goto end

:end
echo.
echo 📚 For detailed instructions, see DEPLOYMENT_GUIDE.md
echo.
pause
