# 🎙️ Advanced Voice Processor

A comprehensive real-time voice processing application with advanced audio effects, noise reduction, and batch processing capabilities. Built with React frontend and FastAPI backend.

![Voice Processor](https://img.shields.io/badge/Status-Production%20Ready-green)
![React](https://img.shields.io/badge/React-19.0.0-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110.1-green)
![Python](https://img.shields.io/badge/Python-3.11+-yellow)
![Node.js](https://img.shields.io/badge/Node.js-16+-green)

## 🌟 Features

### 🎭 Voice Effects & Processing
- **14+ Voice Effects**: Female, Male, Robotic, Alien, Horror, Cartoon, and more
- **Real-time Processing**: Low-latency voice transformation (< 50ms)
- **Advanced Audio Effects**: Echo, Reverb, Pitch Shift, Formant Manipulation
- **ML-Powered Noise Reduction**: Intelligent background noise removal
- **Voice Analysis**: Real-time audio visualization and monitoring

### 🎛️ User Interface
- **Modern Dark Theme**: Professional, eye-friendly interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Controls**: Live adjustment of all voice parameters
- **Toast Notifications**: Beautiful, non-intrusive feedback system
- **Drag & Drop**: Intuitive file upload and management

### 📊 Processing Modes
- **Live Mode**: Real-time voice processing with WebSocket connection
- **Record Mode**: Voice recording with effects applied
- **Upload Mode**: Process audio/video files with batch support
- **Visualizer**: Real-time audio analysis and visualization
- **Batch Processing**: Process multiple files simultaneously
- **Preset Management**: Save and load custom voice configurations

### 🔧 System Integration
- **Virtual Audio Device**: System-wide voice processing
- **Audio Device Management**: Input/output device selection
- **Cross-Platform**: Windows, macOS, and Linux support
- **WebSocket Communication**: Real-time bidirectional audio streaming

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+** with pip
- **Node.js 16+** with npm/yarn
- **Microphone** for real-time processing
- **4GB+ RAM** for audio processing

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Voice-Cancelation-main
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **Frontend Setup** (New Terminal)
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 📁 Project Structure

```
Voice-Cancelation-main/
├── 📁 backend/                    # FastAPI Backend
│   ├── 🐍 server.py              # Main FastAPI server
│   ├── 🐍 enhanced_voice_processor.py  # Voice processing engine
│   ├── 📄 requirements.txt       # Python dependencies
│   └── 🔧 .env                   # Backend configuration
├── 📁 frontend/                   # React Frontend
│   ├── 📁 src/
│   │   ├── ⚛️ App.js             # Main React component
│   │   ├── 🎨 App.css            # Styling and animations
│   │   └── ⚛️ index.js           # React entry point
│   ├── 📄 package.json           # Node.js dependencies
│   ├── ⚙️ craco.config.js        # Build configuration
│   ├── 🎨 tailwind.config.js     # Tailwind CSS config
│   └── 🔧 .env                   # Frontend configuration
├── 📁 tests/                      # Test files
├── 📄 README.md                  # This file
└── 📄 SETUP_GUIDE.md             # Detailed setup guide
```

## 🛠️ Technology Stack

### Frontend
- **React 19.0.0** - Modern UI framework
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Axios 1.8.4** - HTTP client for API communication
- **WebSocket API** - Real-time audio streaming
- **HTML5 Canvas** - Audio visualization
- **Web Audio API** - Client-side audio processing

### Backend
- **FastAPI 0.110.1** - Modern Python web framework
- **Uvicorn 0.25.0** - ASGI server
- **WebSockets 12.0** - Real-time communication
- **PyAudio 0.2.13** - Audio I/O operations
- **Librosa 0.10.1** - Audio analysis and processing
- **Noisereduce 3.0.0** - ML-powered noise reduction
- **SciPy 1.11.0** - Scientific computing
- **PyTorch 2.0.0** - Machine learning framework
- **Pedalboard 0.7.0** - Audio effects processing

### Audio Processing Libraries
- **SoundFile 0.12.1** - Audio file I/O
- **Pydub 0.25.1** - Audio manipulation
- **MoviePy 1.0.3** - Video processing
- **FFmpeg-Python 0.2.0** - Video/audio conversion
- **PyWorld 0.3.0** - Voice analysis
- **WebRTC VAD 2.0.10** - Voice activity detection

## 🎯 Core Features

### 🎙️ Live Voice Processing
- **Real-time Effects**: Apply voice effects with minimal latency
- **Audio Level Monitoring**: Visual feedback of input levels
- **Connection Status**: WebSocket connection monitoring
- **Latency Display**: Real-time processing latency measurement
- **Quick Controls**: One-click voice effect presets

### 📊 Audio Visualizer
- **Waveform Display**: Real-time audio wave visualization
- **Spectrum Analysis**: Frequency content visualization
- **Bar Visualization**: Simple frequency bars with gradients
- **File Upload Support**: Visualize uploaded audio files
- **Interactive Controls**: Switch between visualization modes

### 🎛️ Preset Management
- **Custom Presets**: Create and save voice configurations
- **Default Presets**: Pre-configured voice effects
- **Preset Sharing**: Export/import preset configurations
- **Quick Load**: One-click preset application
- **Preset Editing**: Modify existing presets

### ⚡ Batch Processing
- **Multiple File Upload**: Process multiple audio files
- **Drag & Drop Interface**: Intuitive file management
- **Progress Tracking**: Individual and overall progress bars
- **Queue Management**: Add, remove, and reorder files
- **Bulk Download**: Download all processed files
- **Processing History**: Track completed batch jobs

### 🎤 Recording & Upload
- **Voice Recording**: Record with effects applied
- **File Upload**: Support for various audio formats
- **Format Support**: MP3, WAV, M4A, MP4, MOV, AVI
- **Audio Comparison**: Compare original vs processed audio
- **Download Options**: Download processed files

## 🎨 User Interface

### Navigation
- **Sidebar Navigation**: Clean, organized menu system
- **Tab-based Interface**: Easy switching between features
- **Responsive Design**: Adapts to different screen sizes
- **Dark Theme**: Professional, eye-friendly interface

### Controls
- **Real-time Sliders**: Adjust parameters with immediate feedback
- **Toggle Switches**: Enable/disable features
- **Dropdown Menus**: Select from available options
- **Button Groups**: Organized action buttons
- **Progress Indicators**: Visual feedback for operations

### Notifications
- **Toast System**: Non-intrusive notifications
- **Success Messages**: Confirmation of completed actions
- **Error Handling**: Clear error messages and recovery
- **Status Indicators**: Real-time status updates

## 🔧 Configuration

### Backend Configuration (.env)
```env
# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Audio Processing
SAMPLE_RATE=16000
CHUNK_SIZE=1024
CHANNELS=1

# CORS Settings
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Logging
LOG_LEVEL=INFO
```

### Frontend Configuration (.env)
```env
# Backend URL
REACT_APP_BACKEND_URL=http://localhost:8000

# Development
GENERATE_SOURCEMAP=false
FAST_REFRESH=true
```

## 🎭 Available Voice Effects

| Effect | Description | Use Case |
|--------|-------------|----------|
| 🎤 **None** | Original voice | Professional calls, presentations |
| 👩 **Female** | Female voice transformation | Voice acting, privacy |
| 👨 **Male** | Male voice transformation | Voice acting, privacy |
| 👧 **Girl** | Young girl voice | Content creation, entertainment |
| 👶 **Baby** | Child/baby voice | Content creation, fun |
| 👴 **Old Man** | Elderly male voice | Voice acting, character work |
| 👽 **Alien** | Extraterrestrial voice | Gaming, entertainment |
| 🤖 **Robotic** | Synthetic/robot voice | AI content, futuristic themes |
| 👻 **Horror** | Scary/dark voice | Horror content, gaming |
| 🎭 **Cartoon** | Animated character voice | Content creation, entertainment |
| 📻 **Deep Radio** | Radio announcer voice | Podcasts, broadcasting |
| 💻 **Computer** | AI/computer voice | Tech content, automation |
| 🔊 **Echo** | Echo effect | Music production, effects |
| 🏠 **Wall Echo** | Room reverb | Music production, ambiance |

## 📡 API Endpoints

### Core Endpoints
- `GET /api/` - API status and health check
- `GET /api/voice-effects` - Available voice effects list
- `GET /api/audio-devices` - Available audio input/output devices
- `GET /api/virtual-device-status` - Virtual audio device status

### Processing Endpoints
- `POST /api/process-audio-enhanced` - Process audio files with effects
- `POST /api/process-video-enhanced` - Process video files with effects
- `POST /api/virtual-device/start` - Start virtual audio device
- `POST /api/virtual-device/stop` - Stop virtual audio device

### WebSocket Endpoints
- `ws://localhost:8000/ws/audio-enhanced` - Real-time audio processing stream

## 🚀 Usage Guide

### Getting Started
1. **Launch the Application**: Start both backend and frontend servers
2. **Grant Permissions**: Allow microphone access when prompted
3. **Select Audio Device**: Choose your microphone in settings
4. **Choose Voice Effect**: Select from available voice effects
5. **Start Processing**: Click "Start Real-time Processing"

### Live Mode
1. Navigate to **Live Mode** in the sidebar
2. Select your desired voice effect
3. Adjust advanced settings (pitch, formant, echo, reverb)
4. Click **"Start Real-time Processing"**
5. Speak into your microphone
6. Hear the processed voice in real-time

### Recording Mode
1. Go to **Record** tab
2. Click **"Start Recording"**
3. Speak with your selected effects
4. Click **"Stop Recording"**
5. Click **"Apply Effects"** to process
6. Download the processed audio

### Batch Processing
1. Navigate to **Batch** tab
2. Drag & drop multiple audio files or click **"Select Files"**
3. Review the file queue
4. Click **"Start Processing"**
5. Monitor progress bars
6. Download individual or all processed files

### Preset Management
1. Go to **Presets** tab
2. **Create New Preset**: Click "+ Create Preset"
3. **Load Preset**: Click "Load Preset" on any preset card
4. **Edit Preset**: Click ✏️ on custom presets
5. **Update Preset**: Click 🔄 to update with current settings
6. **Delete Preset**: Click 🗑️ on custom presets

## 🔧 Troubleshooting

### Common Issues

#### Backend Issues
- **Port 8000 in use**: Kill the process using `netstat -ano | findstr :8000`
- **Audio processing errors**: Check microphone permissions and drivers
- **WebSocket connection failed**: Verify firewall settings

#### Frontend Issues
- **Port 3000 in use**: Kill the process using `netstat -ano | findstr :3000`
- **Backend connection failed**: Ensure backend is running on port 8000
- **Audio not working**: Check browser permissions and audio drivers

#### Performance Issues
- **High latency**: Close unnecessary applications, use wired audio
- **Poor audio quality**: Use high-quality microphone, adjust sample rate
- **Memory issues**: Increase available RAM, close other applications

### Debug Mode
Enable debug logging by setting `DEBUG=True` in backend `.env` file.

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend
python backend_test.py

# Frontend tests
cd frontend
npm test
```

### Manual Testing
1. **Audio Input**: Test microphone input and level monitoring
2. **Voice Effects**: Test all available voice effects
3. **File Upload**: Test various audio file formats
4. **Batch Processing**: Test multiple file processing
5. **WebSocket**: Test real-time audio streaming

## 📦 Dependencies

### Frontend Dependencies
```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "axios": "^1.8.4",
  "react-router-dom": "^7.5.1",
  "tailwindcss": "^3.4.17",
  "@craco/craco": "^7.1.0"
}
```

### Backend Dependencies
```txt
fastapi==0.110.1
uvicorn==0.25.0
pyaudio>=0.2.13
librosa>=0.10.1
noisereduce>=3.0.0
scipy>=1.11.0
torch>=2.0.0
pedalboard>=0.7.0
websockets>=12.0
```

## 🚀 Deployment

### Development
```bash
# Backend
cd backend
python -m uvicorn server:app --reload

# Frontend
cd frontend
npm start
```

### Production
```bash
# Backend
cd backend
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker server:app

# Frontend
cd frontend
npm run build
# Serve build/ directory with web server
```

### Docker (Optional)
```dockerfile
# Backend Dockerfile
FROM python:3.11
COPY backend/ /app
WORKDIR /app
RUN pip install -r requirements.txt
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is for educational and personal use. Please ensure compliance with local laws regarding voice modification and recording.

## 🆘 Support

- **Documentation**: Check this README and SETUP_GUIDE.md
- **Issues**: Report bugs via GitHub issues
- **Discussions**: Use GitHub discussions for questions
- **Logs**: Check console output for debugging information

## 🎉 Acknowledgments

- **React Team** for the amazing frontend framework
- **FastAPI Team** for the high-performance backend framework
- **Audio Processing Community** for the excellent Python libraries
- **Open Source Contributors** for the various dependencies

---

**🎙️ Ready to transform your voice? Start the application and begin your audio journey!**

Open http://localhost:3000 in your browser to get started.