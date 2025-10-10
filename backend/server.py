from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
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
import os

# Import enhanced voice processor (simplified version)
try:
    from enhanced_voice_processor import voice_processor, virtual_device
    ENHANCED_PROCESSOR_AVAILABLE = True
except ImportError:
    ENHANCED_PROCESSOR_AVAILABLE = False
    logging.warning("Enhanced voice processor not available, using basic processor")

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

# Simple virtual device simulation
class SimpleVirtualDevice:
    def __init__(self):
        self.is_active = False
        self.input_device = None
        self.output_device = None
        self.processing_enabled = False
        
    def start_virtual_device(self, input_device_id=None, output_device_id=None):
        self.input_device = input_device_id
        self.output_device = output_device_id
        self.is_active = True
        self.processing_enabled = True
        return True
    
    def stop_virtual_device(self):
        self.is_active = False
        self.processing_enabled = False
    
    def get_status(self):
        return {
            'active': self.is_active,
            'input_device': self.input_device,
            'output_device': self.output_device,
            'processing_enabled': self.processing_enabled
        }

# Initialize simple virtual device if enhanced not available
if not ENHANCED_PROCESSOR_AVAILABLE:
    virtual_device = SimpleVirtualDevice()

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection with error handling
try:
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'voice_processing')
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    logging.info(f"Connected to MongoDB: {db_name}")
except Exception as e:
    logging.warning(f"MongoDB connection failed: {e}. Using in-memory storage.")
    # Create a mock database for development
    class MockDB:
        def __getattr__(self, name):
            return MockCollection()
    class MockCollection:
        async def insert_one(self, doc): return {"inserted_id": "mock_id"}
        async def find(self): return []
        def to_list(self, limit): return []
    db = MockDB()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Audio processing configuration
SAMPLE_RATE = 16000
CHUNK_SIZE = 1024
CHANNELS = 1

# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class AdvancedAudioProcessingSettings(BaseModel):
    # Basic settings
    noise_reduction_enabled: bool = True
    voice_change_enabled: bool = False
    
    # Voice effects (enhanced list)
    voice_effect: str = "none"  # none, female, male, girl, baby, old_man, alien, robotic, horror, cartoon, deep_radio, computer, echo, wall_echo
    
    # Fine-tuning parameters
    pitch_shift: float = 0.0  # semitones
    formant_shift: float = 1.0  # formant frequency multiplier
    brightness: float = 1.0  # spectral brightness
    
    # Advanced effects
    echo_enabled: bool = False
    echo_delay: float = 0.3  # seconds
    echo_decay: float = 0.5  # decay factor
    
    reverb_enabled: bool = False
    reverb_room_size: float = 0.5  # 0.0 to 1.0
    
    # System-wide settings
    system_wide_enabled: bool = False
    virtual_device_active: bool = False

class ProcessedAudioResponse(BaseModel):
    success: bool
    message: str
    audio_data: Optional[str] = None  # base64 encoded audio
    processing_time: Optional[float] = None

class VirtualDeviceStatus(BaseModel):
    active: bool
    input_device: Optional[int] = None
    output_device: Optional[int] = None
    processing_enabled: bool = False
    available_devices: List[Dict[str, Any]] = []

class AudioDeviceInfo(BaseModel):
    device_id: int
    name: str
    channels: int
    is_input: bool
    is_output: bool

# WebSocket connection manager (enhanced)
class AdvancedConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.processing_settings = {}
        self.virtual_device_clients = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Set default processing settings
        self.processing_settings[websocket] = AdvancedAudioProcessingSettings()

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.processing_settings:
            del self.processing_settings[websocket]
        if websocket in self.virtual_device_clients:
            self.virtual_device_clients.remove(websocket)

    async def send_audio_data(self, websocket: WebSocket, data: dict):
        try:
            await websocket.send_text(json.dumps(data))
        except Exception as e:
            logging.error(f"Error sending audio data: {e}")

    async def broadcast_virtual_device_status(self, status: dict):
        """Broadcast virtual device status to all connected clients"""
        message = {
            'type': 'virtual_device_status',
            'status': status
        }
        for websocket in self.virtual_device_clients:
            await self.send_audio_data(websocket, message)

manager = AdvancedConnectionManager()

# Audio conversion function using FFmpeg
def convert_webm_to_wav(webm_bytes: bytes) -> bytes:
    """Convert WebM audio to WAV format using FFmpeg"""
    try:
        # Create temporary files
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_webm:
            temp_webm.write(webm_bytes)
            temp_webm_path = temp_webm.name
        
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
            temp_wav_path = temp_wav.name
        
        try:
            # Use FFmpeg to convert WebM to WAV
            cmd = [
                'ffmpeg',
                '-i', temp_webm_path,
                '-acodec', 'pcm_s16le',  # 16-bit PCM
                '-ar', str(SAMPLE_RATE),  # Sample rate
                '-ac', '1',  # Mono
                '-y',  # Overwrite output file
                temp_wav_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                logging.error(f"FFmpeg conversion failed: {result.stderr}")
                raise Exception(f"FFmpeg conversion failed: {result.stderr}")
            
            # Read the converted WAV file
            with open(temp_wav_path, 'rb') as f:
                wav_bytes = f.read()
            
            return wav_bytes
            
        finally:
            # Clean up temporary files
            try:
                os.unlink(temp_webm_path)
                os.unlink(temp_wav_path)
            except:
                pass
                
    except Exception as e:
        logging.error(f"Error converting WebM to WAV: {e}")
        raise

# Enhanced audio processing functions
def get_available_audio_devices() -> List[AudioDeviceInfo]:
    """Get list of available audio devices (simulation)"""
    # In a real implementation, this would query PyAudio or similar
    devices = [
        AudioDeviceInfo(device_id=0, name="Default Input", channels=2, is_input=True, is_output=False),
        AudioDeviceInfo(device_id=1, name="Default Output", channels=2, is_input=False, is_output=True),
        AudioDeviceInfo(device_id=2, name="VB-Cable Input", channels=2, is_input=True, is_output=False),
        AudioDeviceInfo(device_id=3, name="VB-Cable Output", channels=2, is_input=False, is_output=True),
        AudioDeviceInfo(device_id=4, name="Microphone", channels=1, is_input=True, is_output=False),
        AudioDeviceInfo(device_id=5, name="Speakers", channels=2, is_input=False, is_output=True),
    ]
    return devices

# Enhanced audio processing functions
def apply_enhanced_noise_reduction(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    """Enhanced noise reduction using multiple techniques"""
    try:
        # Primary noise reduction
        cleaned = nr.reduce_noise(y=audio, sr=sample_rate, stationary=False)
        
        # Additional spectral subtraction
        cleaned = apply_spectral_subtraction(cleaned, sample_rate)
        
        return cleaned
    except Exception as e:
        logging.error(f"Error in enhanced noise reduction: {e}")
        return audio

def apply_spectral_subtraction(audio: np.ndarray, sample_rate: int, alpha: float = 2.0) -> np.ndarray:
    """Apply spectral subtraction for additional noise reduction"""
    try:
        # Compute STFT
        stft = librosa.stft(audio, n_fft=2048, hop_length=512)
        magnitude = np.abs(stft)
        phase = np.angle(stft)
        
        # Estimate noise from first 0.5 seconds
        noise_frames = int(0.5 * sample_rate / 512)
        if noise_frames > 0 and noise_frames < magnitude.shape[1]:
            noise_spectrum = np.mean(magnitude[:, :noise_frames], axis=1, keepdims=True)
            
            # Apply spectral subtraction
            subtracted = magnitude - alpha * noise_spectrum
            subtracted = np.maximum(subtracted, 0.1 * magnitude)
            
            # Reconstruct signal
            enhanced_stft = subtracted * np.exp(1j * phase)
            enhanced_audio = librosa.istft(enhanced_stft, hop_length=512)
            
            return enhanced_audio
        
        return audio
    except Exception as e:
        logging.error(f"Error in spectral subtraction: {e}")
        return audio

def apply_enhanced_voice_effect(audio: np.ndarray, sample_rate: int, effect: str, 
                               custom_pitch: float = 0.0, settings: dict = None) -> np.ndarray:
    """Apply enhanced voice effects"""
    if effect not in ENHANCED_VOICE_EFFECTS and effect != 'none':
        return audio
    
    if effect == 'none':
        return audio
    
    params = ENHANCED_VOICE_EFFECTS[effect]
    processed = audio.copy()
    
    try:
        # Apply pitch shifting
        pitch_shift = custom_pitch if custom_pitch != 0.0 else params.get('pitch_shift', 0)
        if pitch_shift != 0:
            processed = librosa.effects.pitch_shift(processed, sr=sample_rate, n_steps=pitch_shift)
        
        # Apply brightness adjustment
        if 'brightness' in params:
            processed = adjust_brightness(processed, sample_rate, params['brightness'])
        
        # Special effects
        if params.get('robotize'):
            processed = robotize_voice(processed, sample_rate)
        
        if params.get('modulation'):
            processed = apply_alien_modulation(processed, sample_rate)
        
        if params.get('distortion'):
            processed = apply_horror_distortion(processed, sample_rate)
        
        if params.get('compression'):
            processed = apply_radio_compression(processed)
        
        if params.get('vocoder'):
            processed = apply_vocoder_effect(processed, sample_rate)
        
        if params.get('echo') or (settings and settings.get('echo_enabled')):
            echo_delay = settings.get('echo_delay', 0.3) if settings else 0.3
            echo_decay = settings.get('echo_decay', 0.5) if settings else 0.5
            processed = apply_echo_effect(processed, sample_rate, echo_delay, echo_decay)
        
        if params.get('reverb') or (settings and settings.get('reverb_enabled')):
            processed = apply_reverb_effect(processed, sample_rate)
        
        return processed
        
    except Exception as e:
        logging.error(f"Error applying enhanced voice effect {effect}: {e}")
        return audio

def adjust_brightness(audio: np.ndarray, sample_rate: int, brightness: float) -> np.ndarray:
    """Adjust spectral brightness"""
    if brightness == 1.0:
        return audio
    
    try:
        nyquist = sample_rate / 2
        cutoff = 3000  # Hz
        
        if brightness > 1.0:
            # Emphasize high frequencies
            b, a = signal.butter(2, cutoff/nyquist, btype='high')
            high_freq = signal.filtfilt(b, a, audio)
            return audio + (brightness - 1.0) * high_freq * 0.3
        else:
            # De-emphasize high frequencies
            b, a = signal.butter(2, cutoff/nyquist, btype='low')
            return signal.filtfilt(b, a, audio) * brightness + audio * (1 - brightness)
    except Exception as e:
        logging.error(f"Error adjusting brightness: {e}")
        return audio

def robotize_voice(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    """Create robotic voice effect"""
    try:
        carrier_freq = 220  # Hz
        t = np.arange(len(audio)) / sample_rate
        carrier = np.sin(2 * np.pi * carrier_freq * t)
        
        # Ring modulation
        modulated = audio * (1 + 0.5 * carrier)
        
        # Add harmonics
        harmonics = np.sin(2 * np.pi * carrier_freq * 2 * t) * 0.2
        modulated += harmonics
        
        return np.clip(modulated, -1.0, 1.0)
    except Exception as e:
        logging.error(f"Error in robotize effect: {e}")
        return audio

def apply_alien_modulation(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    """Apply alien-like modulation"""
    try:
        t = np.arange(len(audio)) / sample_rate
        mod_freq = 8 + 3 * np.sin(2 * np.pi * 0.5 * t)
        modulator = np.sin(2 * np.pi * mod_freq * t)
        
        return audio * (1 + 0.4 * modulator)
    except Exception as e:
        logging.error(f"Error in alien modulation: {e}")
        return audio

def apply_horror_distortion(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    """Apply horror-style distortion"""
    try:
        # Soft clipping distortion
        drive = 3.0
        distorted = np.tanh(drive * audio) / np.tanh(drive)
        
        # Low-pass filter for darker sound
        nyquist = sample_rate / 2
        cutoff = 2000  # Hz
        b, a = signal.butter(3, cutoff/nyquist, btype='low')
        filtered = signal.filtfilt(b, a, distorted)
        
        return filtered * 0.8
    except Exception as e:
        logging.error(f"Error in horror distortion: {e}")
        return audio

def apply_radio_compression(audio: np.ndarray) -> np.ndarray:
    """Apply radio-style compression"""
    try:
        threshold = 0.3
        ratio = 4.0
        
        abs_audio = np.abs(audio)
        compressed = np.where(abs_audio > threshold,
                            threshold + (abs_audio - threshold) / ratio,
                            abs_audio)
        
        return np.sign(audio) * compressed
    except Exception as e:
        logging.error(f"Error in radio compression: {e}")
        return audio

def apply_vocoder_effect(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    """Apply computer-like vocoder effect"""
    try:
        num_bands = 8
        nyquist = sample_rate / 2
        
        min_freq = 200
        max_freq = 4000
        bands = np.logspace(np.log10(min_freq), np.log10(max_freq), num_bands + 1)
        
        vocoded = np.zeros_like(audio)
        
        for i in range(num_bands):
            low = bands[i] / nyquist
            high = bands[i + 1] / nyquist
            
            # Band-pass filter
            b, a = signal.butter(3, [low, high], btype='band')
            band_signal = signal.filtfilt(b, a, audio)
            
            # Simple envelope following
            envelope = np.abs(band_signal)
            envelope = signal.medfilt(envelope, kernel_size=min(len(envelope), 21))
            
            # Generate carrier
            carrier_freq = (bands[i] + bands[i + 1]) / 2
            t = np.arange(len(audio)) / sample_rate
            carrier = np.sin(2 * np.pi * carrier_freq * t)
            
            # Apply envelope to carrier
            vocoded += envelope * carrier
        
        return vocoded * 0.3
    except Exception as e:
        logging.error(f"Error in vocoder effect: {e}")
        return audio

def apply_echo_effect(audio: np.ndarray, sample_rate: int, delay: float = 0.3, 
                     decay: float = 0.5) -> np.ndarray:
    """Apply echo effect"""
    try:
        delay_samples = int(delay * sample_rate)
        
        if delay_samples >= len(audio) or delay_samples <= 0:
            return audio
        
        echo = np.zeros_like(audio)
        echo[delay_samples:] = audio[:-delay_samples] * decay
        
        return audio + echo
    except Exception as e:
        logging.error(f"Error in echo effect: {e}")
        return audio

def apply_reverb_effect(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    """Apply simple reverb effect"""
    try:
        reverb_audio = audio.copy()
        
        delays = [0.03, 0.07, 0.15, 0.25]  # seconds
        gains = [0.3, 0.2, 0.15, 0.1]
        
        for delay, gain in zip(delays, gains):
            delay_samples = int(delay * sample_rate)
            if delay_samples < len(audio) and delay_samples > 0:
                delayed = np.zeros_like(audio)
                delayed[delay_samples:] = audio[:-delay_samples] * gain
                reverb_audio += delayed
        
        return reverb_audio
    except Exception as e:
        logging.error(f"Error in reverb effect: {e}")
        return audio

def process_audio_with_enhanced_effects(audio_data: np.ndarray, 
                                      settings: AdvancedAudioProcessingSettings) -> np.ndarray:
    """Process audio with enhanced voice effects"""
    start_time = datetime.now()
    
    try:
        processed_audio = audio_data.copy()
        
        # Apply enhanced noise reduction if enabled
        if settings.noise_reduction_enabled:
            if ENHANCED_PROCESSOR_AVAILABLE:
                processor_settings = {
                    'noise_reduction_enabled': True,
                    'voice_change_enabled': settings.voice_change_enabled,
                    'voice_effect': settings.voice_effect,
                    'pitch_shift': settings.pitch_shift
                }
                processed_audio = voice_processor.process_audio_chunk(processed_audio, processor_settings)
            else:
                processed_audio = apply_enhanced_noise_reduction(processed_audio, SAMPLE_RATE)
        
        # Apply enhanced voice effects if enabled
        if settings.voice_change_enabled:
            effect_settings = {
                'echo_enabled': settings.echo_enabled,
                'echo_delay': settings.echo_delay,
                'echo_decay': settings.echo_decay,
                'reverb_enabled': settings.reverb_enabled,
                'reverb_room_size': settings.reverb_room_size
            }
            
            if ENHANCED_PROCESSOR_AVAILABLE:
                processor_settings = {
                    'noise_reduction_enabled': False,  # Already applied
                    'voice_change_enabled': True,
                    'voice_effect': settings.voice_effect,
                    'pitch_shift': settings.pitch_shift,
                    'formant_shift': settings.formant_shift,
                    'brightness': settings.brightness,
                    **effect_settings
                }
                processed_audio = voice_processor.process_audio_chunk(processed_audio, processor_settings)
            else:
                processed_audio = apply_enhanced_voice_effect(
                    processed_audio, 
                    SAMPLE_RATE, 
                    settings.voice_effect, 
                    settings.pitch_shift,
                    effect_settings
                )
        
        # Apply additional effects
        if settings.echo_enabled and not settings.voice_change_enabled:
            processed_audio = apply_echo_effect(
                processed_audio, 
                SAMPLE_RATE, 
                settings.echo_delay, 
                settings.echo_decay
            )
        
        if settings.reverb_enabled and not settings.voice_change_enabled:
            processed_audio = apply_reverb_effect(processed_audio, SAMPLE_RATE)
        
        # Normalize to prevent clipping
        if np.max(np.abs(processed_audio)) > 0:
            processed_audio = processed_audio / np.max(np.abs(processed_audio)) * 0.9
        
        processing_time = (datetime.now() - start_time).total_seconds()
        logging.info(f"Enhanced audio processing completed in {processing_time:.3f}s")
        
        return processed_audio
        
    except Exception as e:
        logging.error(f"Error in enhanced audio processing: {e}")
        return audio_data

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Enhanced Voice Processing API - Ready! 🎙️✨"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.get("/audio-devices", response_model=List[AudioDeviceInfo])
async def get_audio_devices():
    """Get available audio devices"""
    return get_available_audio_devices()

@api_router.get("/virtual-device-status", response_model=VirtualDeviceStatus)
async def get_virtual_device_status():
    """Get virtual audio device status"""
    status = virtual_device.get_status()
    return VirtualDeviceStatus(
        active=status['active'],
        input_device=status['input_device'],
        output_device=status['output_device'],
        processing_enabled=status['processing_enabled'],
        available_devices=[device.dict() for device in get_available_audio_devices()]
    )

@api_router.post("/virtual-device/start")
async def start_virtual_device(input_device: Optional[int] = None, 
                              output_device: Optional[int] = None):
    """Start virtual audio device"""
    success = virtual_device.start_virtual_device(input_device, output_device)
    
    if success:
        # Broadcast status update to all connected clients
        status = virtual_device.get_status()
        await manager.broadcast_virtual_device_status(status)
        
        return {"success": True, "message": "Virtual audio device started"}
    else:
        raise HTTPException(status_code=500, detail="Failed to start virtual audio device")

@api_router.post("/virtual-device/stop")
async def stop_virtual_device():
    """Stop virtual audio device"""
    virtual_device.stop_virtual_device()
    
    # Broadcast status update to all connected clients
    status = virtual_device.get_status()
    await manager.broadcast_virtual_device_status(status)
    
    return {"success": True, "message": "Virtual audio device stopped"}

@api_router.get("/voice-effects")
async def get_available_voice_effects():
    """Get list of available voice effects"""
    return {
        "effects": [
            {"id": "none", "name": "No Effect", "description": "Original voice"},
            {"id": "female", "name": "Female Voice", "description": "Transform to female voice"},
            {"id": "male", "name": "Male Voice", "description": "Transform to male voice"},
            {"id": "girl", "name": "Girl Voice", "description": "Young girl voice"},
            {"id": "baby", "name": "Baby Voice", "description": "Baby/child voice"},
            {"id": "old_man", "name": "Old Man", "description": "Elderly male voice"},
            {"id": "alien", "name": "Alien", "description": "Extraterrestrial voice"},
            {"id": "robotic", "name": "Robotic", "description": "Robot/synthetic voice"},
            {"id": "horror", "name": "Horror", "description": "Scary/dark voice"},
            {"id": "cartoon", "name": "Cartoon", "description": "Animated character voice"},
            {"id": "deep_radio", "name": "Deep Radio", "description": "Radio announcer voice"},
            {"id": "computer", "name": "Computer", "description": "Computer/AI voice"},
            {"id": "echo", "name": "Echo", "description": "Voice with echo effect"},
            {"id": "wall_echo", "name": "Wall Echo", "description": "Room reverberation effect"}
        ]
    }

@api_router.post("/process-audio-enhanced", response_model=ProcessedAudioResponse)
async def process_audio_enhanced(
    file: UploadFile = File(...),
    settings: str = '{"noise_reduction_enabled": true, "voice_change_enabled": false, "voice_effect": "none"}'
):
    """Process uploaded audio file with enhanced effects"""
    try:
        start_time = datetime.now()
        
        # Parse settings
        settings_dict = json.loads(settings)
        processing_settings = AdvancedAudioProcessingSettings(**settings_dict)
        
        # Read and process audio file
        contents = await file.read()
        
        # Check if it's a WebM file and convert if needed
        if file.filename and file.filename.endswith('.webm') or file.content_type == 'audio/webm':
            logging.info("Converting WebM to WAV using FFmpeg")
            try:
                wav_contents = convert_webm_to_wav(contents)
                audio_data, sample_rate = librosa.load(io.BytesIO(wav_contents), sr=SAMPLE_RATE)
            except Exception as e:
                logging.error(f"WebM conversion failed: {e}")
                raise HTTPException(status_code=400, detail=f"Audio conversion failed: {str(e)}")
        else:
            # Try to load directly with librosa
            try:
                audio_data, sample_rate = librosa.load(io.BytesIO(contents), sr=SAMPLE_RATE)
            except Exception as e:
                logging.error(f"Failed to load audio with librosa: {e}")
                # Try converting with FFmpeg as fallback
                try:
                    logging.info("Trying FFmpeg conversion as fallback")
                    wav_contents = convert_webm_to_wav(contents)
                    audio_data, sample_rate = librosa.load(io.BytesIO(wav_contents), sr=SAMPLE_RATE)
                except Exception as e2:
                    logging.error(f"FFmpeg fallback also failed: {e2}")
                    raise HTTPException(status_code=400, detail=f"Audio format not supported: {str(e)}")
        
        # Process with enhanced effects
        processed_audio = process_audio_with_enhanced_effects(audio_data, processing_settings)
        
        # Convert back to bytes
        output_buffer = io.BytesIO()
        sf.write(output_buffer, processed_audio, sample_rate, format='WAV')
        output_buffer.seek(0)
        
        # Encode to base64
        audio_base64 = base64.b64encode(output_buffer.getvalue()).decode('utf-8')
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return ProcessedAudioResponse(
            success=True,
            message="Audio processed with enhanced effects",
            audio_data=audio_base64,
            processing_time=processing_time
        )
        
    except Exception as e:
        logging.error(f"Error processing audio file: {e}")
        return ProcessedAudioResponse(
            success=False,
            message=f"Error processing audio: {str(e)}"
        )

@api_router.post("/process-video-enhanced")
async def process_video_enhanced(
    file: UploadFile = File(...),
    settings: str = '{"noise_reduction_enabled": true, "voice_change_enabled": false, "voice_effect": "none"}'
):
    """Process uploaded video file with enhanced audio effects"""
    try:
        # Try to import moviepy dynamically
        try:
            from moviepy.editor import VideoFileClip
            from moviepy.audio.io.AudioFileClip import AudioFileClip
        except ImportError:
            raise HTTPException(status_code=500, detail="Video processing not available. MoviePy not installed.")
        
        # Parse settings
        settings_dict = json.loads(settings)
        processing_settings = AdvancedAudioProcessingSettings(**settings_dict)
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_input:
            contents = await file.read()
            tmp_input.write(contents)
            tmp_input.flush()
            
            # Load video and extract audio
            video = VideoFileClip(tmp_input.name)
            audio_clip = video.audio
            
            # Save audio to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_audio:
                audio_clip.write_audiofile(tmp_audio.name, verbose=False, logger=None)
                
                # Load and process audio data
                audio_data, sample_rate = librosa.load(tmp_audio.name, sr=SAMPLE_RATE)
                processed_audio = process_audio_with_enhanced_effects(audio_data, processing_settings)
                
                # Save processed audio
                with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as processed_audio_file:
                    sf.write(processed_audio_file.name, processed_audio, sample_rate)
                    
                    # Create new audio clip and replace in video
                    new_audio = AudioFileClip(processed_audio_file.name)
                    processed_video = video.set_audio(new_audio)
                    
                    # Save processed video
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as output_video:
                        processed_video.write_videofile(output_video.name, verbose=False, logger=None)
                        
                        # Read and return processed video
                        with open(output_video.name, 'rb') as f:
                            processed_video_data = f.read()
                        
                        # Cleanup
                        for temp_file in [tmp_input.name, tmp_audio.name, processed_audio_file.name, output_video.name]:
                            try:
                                os.unlink(temp_file)
                            except:
                                pass
                        
                        return StreamingResponse(
                            io.BytesIO(processed_video_data),
                            media_type="video/mp4",
                            headers={"Content-Disposition": f"attachment; filename=enhanced_{file.filename}"}
                        )
                        
    except Exception as e:
        logging.error(f"Error processing video file: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")

# Enhanced WebSocket endpoint
@app.websocket("/ws/audio-enhanced")
async def websocket_audio_enhanced(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message['type'] == 'audio_data':
                # Process real-time audio with enhanced effects
                audio_base64 = message['audio_data']
                audio_bytes = base64.b64decode(audio_base64)
                
                try:
                    # Decode as Float32Array (from ScriptProcessorNode)
                    audio_data = np.frombuffer(audio_bytes, dtype=np.float32)
                    
                    # Get processing settings
                    settings = manager.processing_settings.get(websocket, AdvancedAudioProcessingSettings())
                    
                    # Process audio
                    processed_audio = process_audio_with_enhanced_effects(audio_data, settings)
                    
                    # Send processed audio back
                    processed_bytes = processed_audio.astype(np.float32).tobytes()
                    processed_base64 = base64.b64encode(processed_bytes).decode('utf-8')
                    
                    await manager.send_audio_data(websocket, {
                        'type': 'processed_audio',
                        'audio_data': processed_base64,
                        'processing_latency': 0.01  # Simulated low latency
                    })
                    
                except Exception as e:
                    logging.error(f"Error processing audio data: {e}")
                    # Send back original audio or silence
                    silence = np.zeros(1024, dtype=np.float32)
                    processed_bytes = silence.astype(np.float32).tobytes()
                    processed_base64 = base64.b64encode(processed_bytes).decode('utf-8')
                    
                    await manager.send_audio_data(websocket, {
                        'type': 'processed_audio',
                        'audio_data': processed_base64,
                        'processing_latency': 0.01
                    })
                
            elif message['type'] == 'settings_update':
                # Update enhanced processing settings
                settings_data = message['settings']
                manager.processing_settings[websocket] = AdvancedAudioProcessingSettings(**settings_data)
                
                await manager.send_audio_data(websocket, {
                    'type': 'settings_updated',
                    'message': 'Enhanced processing settings updated'
                })
                
            elif message['type'] == 'virtual_device_subscribe':
                # Subscribe to virtual device status updates
                if websocket not in manager.virtual_device_clients:
                    manager.virtual_device_clients.append(websocket)
                
                # Send current status
                status = virtual_device.get_status()
                await manager.send_audio_data(websocket, {
                    'type': 'virtual_device_status',
                    'status': status
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logging.error(f"Enhanced WebSocket error: {e}")
        manager.disconnect(websocket)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()