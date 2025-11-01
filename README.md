# 🎙️ Advanced Voice Processor

A real-time voice processing app with advanced effects, noise reduction, and batch file support — built using **React** (frontend) and **FastAPI** (backend).

---

## 🚀 Quick Start

### 🔧 Requirements
- Python **3.11+**
- Node.js **16+**
- Microphone (for live processing)

---

### 🧩 Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd Voice-Cancelation-main
   ```

2. **Start Backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   python -m uvicorn server:app --reload
   ```
   - Backend URL → [http://localhost:8000](http://localhost:8000)
   - API Docs → [http://localhost:8000/docs](http://localhost:8000/docs)

3. **Start Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   - Frontend URL → [http://localhost:3000](http://localhost:3000)

---

## 🎛️ Features
- Real-time voice effects  
- ML-powered noise reduction  
- Batch audio/video processing  
- Preset management & live mode  

---

## ⚡ Troubleshooting
- **Port in use** → `netstat -ano | findstr :8000`  
- **No audio** → Check mic permissions  
- **Connection failed** → Make sure backend is running  

---

## 🧪 Testing
```bash
# Backend
cd backend
python backend_test.py

# Frontend
cd frontend
npm test
```

---

## 📄 License
This project is for **educational and personal use only**.

---

💡 **Run backend → frontend → open [http://localhost:3000](http://localhost:3000) and start processing your voice!**
