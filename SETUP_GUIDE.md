# 🎙️ System-Wide Voice Changer - Setup Guide

## Project Overview

This is a **System-Wide Voice Changer** application with advanced voice processing capabilities including:

- **Real-time voice effects** (female, male, robotic, alien, etc.)
- **ML-powered noise cancellation**
- **Virtual audio device simulation**
- **File upload processing** for audio/video
- **WebSocket-based real-time processing**
- **Modern React frontend** with Tailwind CSS

## Prerequisites

### Required Software
- **Python 3.11+** (with pip)
- **Node.js 16+** (with npm)
- **MongoDB** (optional, for data persistence)

### System Requirements
- **Windows 10/11** (tested on Windows)
- **4GB+ RAM** (for audio processing)
- **Microphone** (for real-time processing)

## Quick Start

### 1. Clone and Navigate
```bash
cd C:\Users\kunjm\Desktop\Voice-Cancelation-main
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the backend server
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at: `http://localhost:8000`

### 3. Frontend Setup (New Terminal)
```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start the frontend development server
npm start
```

The frontend will be available at: `http://localhost:3000`

## Environment Configuration

### Backend Environment (.env)
The backend `.env` file has been created with the following configuration:
```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=voice_processing

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Audio Processing Configuration
SAMPLE_RATE=16000
CHUNK_SIZE=1024
CHANNELS=1

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Logging Configuration
LOG_LEVEL=INFO
```

### Frontend Environment (.env)
The frontend `.env` file has been created with:
```env
# Backend URL Configuration
REACT_APP_BACKEND_URL=http://localhost:8000

# Development Configuration
GENERATE_SOURCEMAP=false
FAST_REFRESH=true
```

## Features

### 🎙️ Live Mode
- **Real-time voice processing** with WebSocket connection
- **Audio level monitoring** with visual feedback
- **Multiple voice effects** (14 different effects)
- **Low-latency processing** (< 50ms)

### 📁 Upload Mode
- **File upload** for audio/video processing
- **Batch processing** with progress tracking
- **Download processed files**
- **Support for multiple formats** (MP3, WAV, MP4, MOV, AVI)

### ⚙️ System Control
- **Virtual audio device** management
- **System-wide voice processing**
- **Audio device selection**
- **Real-time settings adjustment**

## Voice Effects Available

1. **None** - Original voice
2. **Female** - Transform to female voice
3. **Male** - Transform to male voice
4. **Girl** - Young girl voice
5. **Baby** - Baby/child voice
6. **Old Man** - Elderly male voice
7. **Alien** - Extraterrestrial voice
8. **Robotic** - Robot/synthetic voice
9. **Horror** - Scary/dark voice
10. **Cartoon** - Animated character voice
11. **Deep Radio** - Radio announcer voice
12. **Computer** - Computer/AI voice
13. **Echo** - Voice with echo effect
14. **Wall Echo** - Room reverberation effect

## API Endpoints

### Core Endpoints
- `GET /api/` - API status
- `GET /api/voice-effects` - Available voice effects
- `GET /api/audio-devices` - Available audio devices
- `GET /api/virtual-device-status` - Virtual device status

### Processing Endpoints
- `POST /api/process-audio-enhanced` - Process audio files
- `POST /api/process-video-enhanced` - Process video files
- `POST /api/virtual-device/start` - Start virtual device
- `POST /api/virtual-device/stop` - Stop virtual device

### WebSocket
- `ws://localhost:8000/ws/audio-enhanced` - Real-time audio processing

## Troubleshooting

### Common Issues

#### Backend Issues
1. **Port 8000 already in use**
   ```bash
   # Kill process using port 8000
   netstat -ano | findstr :8000
   taskkill /PID <PID> /F
   ```

2. **MongoDB connection error**
   - The app works without MongoDB (uses in-memory storage)
   - Install MongoDB if you need data persistence

3. **Audio processing errors**
   - Ensure microphone permissions are granted
   - Check if audio drivers are up to date

#### Frontend Issues
1. **Port 3000 already in use**
   ```bash
   # Kill process using port 3000
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. **Backend connection failed**
   - Ensure backend is running on port 8000
   - Check firewall settings
   - Verify .env file configuration

### Performance Optimization

1. **Reduce latency**
   - Close unnecessary applications
   - Use wired microphone/headphones
   - Ensure stable internet connection

2. **Improve audio quality**
   - Use high-quality microphone
   - Adjust sample rate in settings
   - Enable noise reduction

## Development

### Project Structure
```
Voice-Cancelation-main/
├── backend/
│   ├── server.py                 # Main FastAPI server
│   ├── enhanced_voice_processor.py # Voice processing logic
│   ├── requirements.txt          # Python dependencies
│   └── .env                      # Backend configuration
├── frontend/
│   ├── src/
│   │   ├── App.js               # Main React component
│   │   ├── App.css              # Styling
│   │   └── index.js             # React entry point
│   ├── package.json             # Node.js dependencies
│   └── .env                     # Frontend configuration
└── SETUP_GUIDE.md              # This file
```

### Adding New Voice Effects
1. Edit `backend/enhanced_voice_processor.py`
2. Add effect parameters to `ENHANCED_VOICE_EFFECTS`
3. Implement processing logic in `apply_enhanced_voice_effect()`
4. Update frontend effect list in `App.js`

### Customizing UI
- Edit `frontend/src/App.js` for component changes
- Modify `frontend/src/App.css` for styling
- Update `frontend/tailwind.config.js` for theme changes

## Production Deployment

### Backend Deployment
1. Set `DEBUG=False` in `.env`
2. Use production ASGI server (Gunicorn + Uvicorn)
3. Configure reverse proxy (Nginx)
4. Set up SSL certificates

### Frontend Deployment
1. Build production bundle: `npm run build`
2. Serve static files with web server
3. Configure environment variables
4. Set up CDN for assets

## Support

### Logs
- Backend logs: Console output from uvicorn
- Frontend logs: Browser developer console
- Audio processing logs: Backend console

### Testing
Run the included test suite:
```bash
cd backend
python backend_test.py
```

## License

This project is for educational and personal use. Please ensure compliance with local laws regarding voice modification and recording.

---

**🎉 Your System-Wide Voice Changer is now ready to use!**

Open `http://localhost:3000` in your browser to start using the application.
