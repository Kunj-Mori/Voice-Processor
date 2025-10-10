from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import asyncio
import json
import numpy as np
import noisereduce as nr
import librosa
import soundfile as sf
import io
import base64
import tempfile
import shutil
import scipy.signal
from scipy import signal
import subprocess

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Advanced Voice Processor API",
    description="Real-time voice processing with advanced effects",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enhanced voice effects mapping
ENHANCED_VOICE_EFFECTS = {
    'female': {'pitch_shift': 4, 'formant_shift': 1.2, 'brightness': 1.1},
    'male': {'pitch_shift': -4, 'formant_shift': 0.8, 'brightness': 0.9},
    'girl': {'pitch_shift': 8, 'formant_shift': 1.4, 'brightness': 1.3},
    'baby': {'pitch_shift': 12, 'formant_shift': 1.6, 'brightness': 1.4},
    'old_man': {'pitch_shift': -6, 'formant_shift': 0.7, 'brightness': 0.7},
    'alien': {'pitch_shift': 0, 'formant_shift': 2.0, 'brightness': 0.6, 'modulation': True},
    'robotic': {'pitch_shift': 0, 'formant_shift': 1.0, 'brightness': 0.5, 'robotize': True},
    'horror': {'pitch_shift': -8, 'formant_shift': 0.6, 'brightness': 0.4, 'distortion': True},
    'cartoon': {'pitch_shift': 10, 'formant_shift': 1.5, 'brightness': 1.5},
    'deep_radio': {'pitch_shift': -6, 'formant_shift': 0.8, 'brightness': 0.8, 'compression': True},
    'computer': {'pitch_shift': 0, 'formant_shift': 1.0, 'brightness': 0.6, 'vocoder': True},
    'echo': {'pitch_shift': 0, 'formant_shift': 1.0, 'brightness': 1.0, 'echo': True},
    'wall_echo': {'pitch_shift': 0, 'formant_shift': 1.0, 'brightness': 1.0, 'reverb': True}
}

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            self.disconnect(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")
                self.disconnect(connection)

manager = ConnectionManager()

# Pydantic models
class AudioProcessingRequest(BaseModel):
    effect: str = "none"
    noise_reduction: bool = True
    pitch_shift: int = 0
    formant_shift: float = 1.0
    echo_enabled: bool = False
    reverb_enabled: bool = False

class StatusCheck(BaseModel):
    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Audio processing functions (cloud-compatible)
def apply_enhanced_voice_effect(audio_data: np.ndarray, sample_rate: int, effect_params: dict) -> np.ndarray:
    """Apply enhanced voice effects to audio data"""
    try:
        processed_audio = audio_data.copy()
        
        # Pitch shifting
        if effect_params.get('pitch_shift', 0) != 0:
            processed_audio = librosa.effects.pitch_shift(
                processed_audio, 
                sr=sample_rate, 
                n_steps=effect_params['pitch_shift']
            )
        
        # Formant shifting (simplified)
        if effect_params.get('formant_shift', 1.0) != 1.0:
            # Simple formant shifting using resampling
            formant_factor = effect_params['formant_shift']
            if formant_factor != 1.0:
                new_length = int(len(processed_audio) / formant_factor)
                processed_audio = signal.resample(processed_audio, new_length)
        
        # Brightness adjustment
        if effect_params.get('brightness', 1.0) != 1.0:
            brightness = effect_params['brightness']
            # Simple brightness adjustment using high-pass filter
            if brightness > 1.0:
                # Increase brightness (emphasize high frequencies)
                sos = signal.butter(4, 1000, btype='high', fs=sample_rate, output='sos')
                processed_audio = signal.sosfilt(sos, processed_audio)
                processed_audio *= brightness
        
        # Special effects
        if effect_params.get('robotize', False):
            # Simple robotization using bit crushing
            processed_audio = np.round(processed_audio * 8) / 8
        
        if effect_params.get('echo', False):
            # Simple echo effect
            echo_delay = int(sample_rate * 0.3)  # 300ms delay
            echo_audio = np.zeros_like(processed_audio)
            echo_audio[echo_delay:] = processed_audio[:-echo_delay] * 0.3
            processed_audio = processed_audio + echo_audio
        
        if effect_params.get('reverb', False):
            # Simple reverb using multiple delays
            reverb_audio = np.zeros_like(processed_audio)
            delays = [0.1, 0.2, 0.3, 0.4]  # Different delay times
            for delay in delays:
                delay_samples = int(sample_rate * delay)
                if delay_samples < len(processed_audio):
                    reverb_audio[delay_samples:] += processed_audio[:-delay_samples] * 0.1
            processed_audio = processed_audio + reverb_audio
        
        return processed_audio
        
    except Exception as e:
        logger.error(f"Error applying voice effect: {e}")
        return audio_data

def process_audio_enhanced(audio_data: np.ndarray, sample_rate: int, effect: str = "none", 
                          noise_reduction: bool = True, pitch_shift: int = 0, 
                          formant_shift: float = 1.0, echo_enabled: bool = False, 
                          reverb_enabled: bool = False) -> np.ndarray:
    """Process audio with enhanced effects"""
    try:
        processed_audio = audio_data.copy()
        
        # Noise reduction
        if noise_reduction:
            try:
                processed_audio = nr.reduce_noise(y=processed_audio, sr=sample_rate)
            except Exception as e:
                logger.warning(f"Noise reduction failed: {e}")
        
        # Apply voice effect
        if effect in ENHANCED_VOICE_EFFECTS:
            effect_params = ENHANCED_VOICE_EFFECTS[effect].copy()
            
            # Override with custom parameters
            if pitch_shift != 0:
                effect_params['pitch_shift'] = pitch_shift
            if formant_shift != 1.0:
                effect_params['formant_shift'] = formant_shift
            if echo_enabled:
                effect_params['echo'] = True
            if reverb_enabled:
                effect_params['reverb'] = True
            
            processed_audio = apply_enhanced_voice_effect(processed_audio, sample_rate, effect_params)
        
        return processed_audio
        
    except Exception as e:
        logger.error(f"Error processing audio: {e}")
        return audio_data

# API Routes
@app.get("/")
async def root():
    return {"message": "Advanced Voice Processor API - Cloud Ready!"}

@app.get("/api/")
async def api_root():
    return {"message": "Voice Processing API - Ready!"}

@app.get("/api/voice-effects")
async def get_voice_effects():
    return {"effects": list(ENHANCED_VOICE_EFFECTS.keys())}

@app.get("/api/health")
async def health_check():
    return StatusCheck()

@app.post("/api/process-audio-enhanced")
async def process_audio_file(
    file: UploadFile = File(...),
    effect: str = "none",
    noise_reduction: bool = True,
    pitch_shift: int = 0,
    formant_shift: float = 1.0,
    echo_enabled: bool = False,
    reverb_enabled: bool = False
):
    """Process uploaded audio file with enhanced effects"""
    try:
        # Read uploaded file
        audio_bytes = await file.read()
        
        # Load audio using librosa
        audio_data, sample_rate = librosa.load(io.BytesIO(audio_bytes), sr=None)
        
        # Process audio
        processed_audio = process_audio_enhanced(
            audio_data, sample_rate, effect, noise_reduction,
            pitch_shift, formant_shift, echo_enabled, reverb_enabled
        )
        
        # Convert back to bytes
        output_buffer = io.BytesIO()
        sf.write(output_buffer, processed_audio, sample_rate, format='WAV')
        output_buffer.seek(0)
        
        return StreamingResponse(
            io.BytesIO(output_buffer.getvalue()),
            media_type="audio/wav",
            headers={"Content-Disposition": f"attachment; filename=processed_{file.filename}"}
        )
        
    except Exception as e:
        logger.error(f"Error processing audio file: {e}")
        raise HTTPException(status_code=500, detail=f"Audio processing failed: {str(e)}")

@app.websocket("/ws/audio-enhanced")
async def websocket_audio_enhanced(websocket: WebSocket):
    """WebSocket endpoint for real-time audio processing"""
    await manager.connect(websocket)
    try:
        while True:
            # Receive audio data
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "audio":
                # Process audio data
                audio_base64 = message.get("audio_data")
                effect = message.get("effect", "none")
                noise_reduction = message.get("noise_reduction", True)
                pitch_shift = message.get("pitch_shift", 0)
                formant_shift = message.get("formant_shift", 1.0)
                echo_enabled = message.get("echo_enabled", False)
                reverb_enabled = message.get("reverb_enabled", False)
                
                try:
                    # Decode base64 audio
                    audio_bytes = base64.b64decode(audio_base64)
                    
                    # Load audio
                    audio_data, sample_rate = librosa.load(io.BytesIO(audio_bytes), sr=16000)
                    
                    # Process audio
                    processed_audio = process_audio_enhanced(
                        audio_data, sample_rate, effect, noise_reduction,
                        pitch_shift, formant_shift, echo_enabled, reverb_enabled
                    )
                    
                    # Convert back to base64
                    output_buffer = io.BytesIO()
                    sf.write(output_buffer, processed_audio, sample_rate, format='WAV')
                    output_buffer.seek(0)
                    processed_base64 = base64.b64encode(output_buffer.getvalue()).decode()
                    
                    # Send processed audio back
                    response = {
                        "type": "processed_audio",
                        "audio_data": processed_base64,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    
                    await manager.send_personal_message(json.dumps(response), websocket)
                    
                except Exception as e:
                    logger.error(f"Error processing real-time audio: {e}")
                    error_response = {
                        "type": "error",
                        "message": f"Audio processing failed: {str(e)}"
                    }
                    await manager.send_personal_message(json.dumps(error_response), websocket)
            
            elif message.get("type") == "ping":
                # Respond to ping
                pong_response = {
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }
                await manager.send_personal_message(json.dumps(pong_response), websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
