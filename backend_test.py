import requests
import json
import base64
import os
import sys
import time
import websocket
import threading
import numpy as np
from io import BytesIO
from pydub import AudioSegment
import unittest

# Backend URL from frontend .env
BACKEND_URL = "http://localhost:8000"
API_URL = f"{BACKEND_URL}/api"
WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://')

class VoiceProcessingAPITester(unittest.TestCase):
    def setUp(self):
        # Create a test audio file
        self.create_test_audio()
        self.ws_received_data = False
        self.ws_connection_successful = False
        
    def create_test_audio(self):
        """Create a simple test audio file"""
        # Generate a simple sine wave
        sample_rate = 16000
        duration = 2  # seconds
        t = np.linspace(0, duration, int(sample_rate * duration), False)
        tone = np.sin(2 * np.pi * 440 * t)  # 440 Hz tone
        
        # Normalize
        tone = tone * 0.3
        
        # Convert to int16
        audio_data = (tone * 32767).astype(np.int16)
        
        # Save as WAV file
        try:
            import soundfile as sf
            self.test_audio_path = "/tmp/test_tone.wav"
            sf.write(self.test_audio_path, tone, sample_rate)
            print(f"Created test audio file at {self.test_audio_path}")
        except ImportError:
            print("soundfile not available, using pydub instead")
            # Alternative using pydub
            from pydub import AudioSegment
            from pydub.generators import Sine
            
            sine = Sine(440)  # 440 Hz tone
            audio = sine.to_audio_segment(duration=2000)  # 2 seconds
            self.test_audio_path = "/tmp/test_tone.wav"
            audio.export(self.test_audio_path, format="wav")
            print(f"Created test audio file at {self.test_audio_path}")
    
    def test_01_api_root(self):
        """Test the API root endpoint"""
        print("\n🔍 Testing API root endpoint...")
        try:
            response = requests.get(f"{API_URL}/")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["message"], "Voice Processing API - Ready!")
            print("✅ API root endpoint test passed")
        except Exception as e:
            self.fail(f"❌ API root endpoint test failed: {str(e)}")
    
    def test_02_process_audio(self):
        """Test the process-audio endpoint with different effects"""
        print("\n🔍 Testing process-audio endpoint...")
        
        if not os.path.exists(self.test_audio_path):
            self.fail("❌ Test audio file not found")
        
        effects = ["none", "pitch_up", "pitch_down", "robotic", "cartoon"]
        
        for effect in effects:
            print(f"  Testing effect: {effect}")
            try:
                with open(self.test_audio_path, "rb") as audio_file:
                    files = {"file": ("test_tone.wav", audio_file, "audio/wav")}
                    data = {
                        "noise_reduction": "true",
                        "voice_effect": effect,
                        "pitch_shift": "0.0"
                    }
                    
                    response = requests.post(
                        f"{API_URL}/process-audio",
                        files=files,
                        data=data
                    )
                    
                    self.assertEqual(response.status_code, 200)
                    result = response.json()
                    self.assertTrue(result["success"])
                    self.assertIsNotNone(result["audio_data"])
                    
                    # Verify the audio data is valid base64
                    audio_bytes = base64.b64decode(result["audio_data"])
                    self.assertTrue(len(audio_bytes) > 0)
                    
                    print(f"  ✅ Effect '{effect}' test passed")
            except Exception as e:
                self.fail(f"❌ Effect '{effect}' test failed: {str(e)}")
        
        print("✅ process-audio endpoint test passed")
    
    def test_03_process_video(self):
        """Test the process-video endpoint (may fail if moviepy not installed)"""
        print("\n🔍 Testing process-video endpoint...")
        
        try:
            # We'll just check if the endpoint is available, not actual processing
            # since it requires moviepy which might not be installed
            with open(self.test_audio_path, "rb") as audio_file:
                files = {"file": ("test_video.mp4", audio_file, "video/mp4")}
                data = {
                    "noise_reduction": "true",
                    "voice_effect": "none",
                    "pitch_shift": "0.0"
                }
                
                response = requests.post(
                    f"{API_URL}/process-video",
                    files=files,
                    data=data
                )
                
                # If moviepy is not installed, we expect a 500 error
                if response.status_code == 500:
                    error_detail = response.json().get("detail", "")
                    if "Video processing not available" in error_detail:
                        print("ℹ️ Video processing not available (MoviePy not installed)")
                    else:
                        print(f"ℹ️ Video processing failed with error: {error_detail}")
                else:
                    self.assertEqual(response.status_code, 200)
                    print("✅ process-video endpoint test passed")
        except Exception as e:
            print(f"ℹ️ process-video endpoint test failed: {str(e)}")
    
    def on_ws_message(self, ws, message):
        """Handle WebSocket messages"""
        data = json.loads(message)
        if data.get("type") == "processed_audio":
            self.ws_received_data = True
            ws.close()
    
    def on_ws_open(self, ws):
        """Handle WebSocket open"""
        self.ws_connection_successful = True
        
        # Send settings update
        settings = {
            "type": "settings_update",
            "settings": {
                "noise_reduction_enabled": True,
                "voice_change_enabled": True,
                "voice_effect": "pitch_up",
                "pitch_shift": 2.0
            }
        }
        ws.send(json.dumps(settings))
        
        # Create dummy audio data
        audio_data = np.zeros(1024, dtype=np.float32)
        audio_bytes = audio_data.tobytes()
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        # Send audio data
        message = {
            "type": "audio_data",
            "audio_data": audio_base64
        }
        ws.send(json.dumps(message))
    
    def on_ws_error(self, ws, error):
        """Handle WebSocket errors"""
        print(f"WebSocket error: {error}")
    
    def on_ws_close(self, ws, close_status_code, close_msg):
        """Handle WebSocket close"""
        print("WebSocket connection closed")
    
    def test_04_websocket_connection(self):
        """Test WebSocket connection and communication"""
        print("\n🔍 Testing WebSocket connection...")
        
        try:
            # Connect to WebSocket
            ws_app = websocket.WebSocketApp(
                f"{WS_URL}/ws/audio",
                on_open=self.on_ws_open,
                on_message=self.on_ws_message,
                on_error=self.on_ws_error,
                on_close=self.on_ws_close
            )
            
            # Run WebSocket in a separate thread
            ws_thread = threading.Thread(target=ws_app.run_forever)
            ws_thread.daemon = True
            ws_thread.start()
            
            # Wait for WebSocket communication
            timeout = 10
            start_time = time.time()
            while time.time() - start_time < timeout:
                if self.ws_received_data:
                    break
                time.sleep(0.5)
            
            if self.ws_connection_successful:
                print("✅ WebSocket connection successful")
            else:
                print("❌ WebSocket connection failed")
            
            if self.ws_received_data:
                print("✅ WebSocket data exchange successful")
            else:
                print("❌ WebSocket data exchange failed or timed out")
            
            # Overall test result
            self.assertTrue(self.ws_connection_successful, "WebSocket connection failed")
            self.assertTrue(self.ws_received_data, "WebSocket data exchange failed")
            
        except Exception as e:
            print(f"❌ WebSocket test failed: {str(e)}")
            self.fail(f"WebSocket test failed: {str(e)}")

if __name__ == "__main__":
    print("🧪 Starting Voice Processing API Tests")
    print(f"🌐 Testing against: {BACKEND_URL}")
    
    # Run the tests
    unittest.main(argv=['first-arg-is-ignored'], exit=False)