"""
Enhanced Voice Processing Module
Provides advanced voice effects, noise cancellation, and virtual audio routing
"""

import numpy as np
import librosa
import scipy.signal
from scipy import signal
import noisereduce as nr
from typing import Tuple, Optional
import logging

class AdvancedVoiceProcessor:
    """Advanced voice processing with multiple voice effects and noise cancellation"""
    
    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate
        self.frame_size = 1024
        self.hop_size = 512
        
        # Voice effect parameters
        self.voice_effects = {
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
    
    def apply_noise_reduction(self, audio: np.ndarray) -> np.ndarray:
        """Advanced noise reduction using multiple techniques"""
        try:
            # Primary noise reduction
            cleaned = nr.reduce_noise(y=audio, sr=self.sample_rate, stationary=False)
            
            # Additional spectral subtraction
            cleaned = self._spectral_subtraction(cleaned)
            
            # Voice activity detection and enhancement
            cleaned = self._enhance_speech_segments(cleaned)
            
            return cleaned
        except Exception as e:
            logging.error(f"Error in noise reduction: {e}")
            return audio
    
    def _spectral_subtraction(self, audio: np.ndarray, alpha: float = 2.0) -> np.ndarray:
        """Apply spectral subtraction for additional noise reduction"""
        # Compute STFT
        stft = librosa.stft(audio, n_fft=2048, hop_length=512)
        magnitude = np.abs(stft)
        phase = np.angle(stft)
        
        # Estimate noise from first 0.5 seconds
        noise_frames = int(0.5 * self.sample_rate / 512)
        noise_spectrum = np.mean(magnitude[:, :noise_frames], axis=1, keepdims=True)
        
        # Apply spectral subtraction
        subtracted = magnitude - alpha * noise_spectrum
        subtracted = np.maximum(subtracted, 0.1 * magnitude)
        
        # Reconstruct signal
        enhanced_stft = subtracted * np.exp(1j * phase)
        enhanced_audio = librosa.istft(enhanced_stft, hop_length=512)
        
        return enhanced_audio
    
    def _enhance_speech_segments(self, audio: np.ndarray) -> np.ndarray:
        """Enhance segments that contain speech"""
        try:
            # Simple VAD using energy and spectral features
            frame_length = 1024
            hop_length = 512
            
            # Compute frame energy
            frames = librosa.util.frame(audio, frame_length=frame_length, hop_length=hop_length)
            energy = np.sum(frames**2, axis=0)
            
            # Compute spectral centroid
            spectral_centroids = librosa.feature.spectral_centroid(y=audio, sr=self.sample_rate)[0]
            
            # Simple VAD: combine energy and spectral features
            energy_threshold = np.percentile(energy, 30)
            voice_mask = (energy > energy_threshold) & (spectral_centroids > 1000)
            
            # Apply gain to voiced segments
            enhanced = audio.copy()
            for i, is_voice in enumerate(voice_mask):
                start = i * hop_length
                end = min(start + hop_length, len(enhanced))
                if is_voice:
                    enhanced[start:end] *= 1.1  # Slight boost for voice segments
            
            return enhanced
        except Exception as e:
            logging.error(f"Error in speech enhancement: {e}")
            return audio
    
    def apply_voice_effect(self, audio: np.ndarray, effect: str, 
                          custom_pitch: float = 0.0) -> np.ndarray:
        """Apply sophisticated voice effects"""
        if effect not in self.voice_effects and effect != 'none':
            return audio
        
        if effect == 'none':
            return audio
        
        params = self.voice_effects[effect]
        processed = audio.copy()
        
        try:
            # Apply pitch shifting
            pitch_shift = custom_pitch if custom_pitch != 0.0 else params.get('pitch_shift', 0)
            if pitch_shift != 0:
                processed = librosa.effects.pitch_shift(processed, sr=self.sample_rate, n_steps=pitch_shift)
            
            # Apply formant shifting (simulate different vocal tract lengths)
            if 'formant_shift' in params:
                processed = self._apply_formant_shift(processed, params['formant_shift'])
            
            # Apply brightness adjustment
            if 'brightness' in params:
                processed = self._adjust_brightness(processed, params['brightness'])
            
            # Special effects
            if params.get('robotize'):
                processed = self._robotize_voice(processed)
            
            if params.get('modulation'):
                processed = self._apply_alien_modulation(processed)
            
            if params.get('distortion'):
                processed = self._apply_horror_distortion(processed)
            
            if params.get('compression'):
                processed = self._apply_radio_compression(processed)
            
            if params.get('vocoder'):
                processed = self._apply_vocoder_effect(processed)
            
            if params.get('echo'):
                processed = self._apply_echo_effect(processed)
            
            if params.get('reverb'):
                processed = self._apply_reverb_effect(processed)
            
            return processed
            
        except Exception as e:
            logging.error(f"Error applying voice effect {effect}: {e}")
            return audio
    
    def _apply_formant_shift(self, audio: np.ndarray, shift_factor: float) -> np.ndarray:
        """Apply formant shifting by time-stretching spectral envelope"""
        try:
            # Use phase vocoder for formant shifting
            stft = librosa.stft(audio, n_fft=2048, hop_length=512)
            
            # Frequency domain manipulation for formant shifting
            freqs = librosa.fft_frequencies(sr=self.sample_rate, n_fft=2048)
            shifted_stft = np.zeros_like(stft)
            
            for i in range(stft.shape[1]):
                frame = stft[:, i]
                magnitude = np.abs(frame)
                phase = np.angle(frame)
                
                # Interpolate magnitude spectrum
                new_freqs = freqs * shift_factor
                valid_mask = new_freqs < freqs[-1]
                
                if np.any(valid_mask):
                    shifted_magnitude = np.interp(freqs, new_freqs[valid_mask], 
                                                magnitude[valid_mask])
                    shifted_stft[:, i] = shifted_magnitude * np.exp(1j * phase)
            
            return librosa.istft(shifted_stft, hop_length=512)
        except Exception as e:
            logging.error(f"Error in formant shifting: {e}")
            return audio
    
    def _adjust_brightness(self, audio: np.ndarray, brightness: float) -> np.ndarray:
        """Adjust spectral brightness by emphasizing/de-emphasizing high frequencies"""
        # Apply high-frequency emphasis/de-emphasis
        if brightness != 1.0:
            # Simple high-pass/low-pass filtering approach
            nyquist = self.sample_rate / 2
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
        return audio
    
    def _robotize_voice(self, audio: np.ndarray) -> np.ndarray:
        """Create robotic voice effect using vocoding"""
        # Simple vocoder effect
        carrier_freq = 220  # Hz
        t = np.arange(len(audio)) / self.sample_rate
        carrier = np.sin(2 * np.pi * carrier_freq * t)
        
        # Ring modulation
        modulated = audio * (1 + 0.5 * carrier)
        
        # Add some harmonic content
        harmonics = np.sin(2 * np.pi * carrier_freq * 2 * t) * 0.2
        modulated += harmonics
        
        return np.clip(modulated, -1.0, 1.0)
    
    def _apply_alien_modulation(self, audio: np.ndarray) -> np.ndarray:
        """Apply alien-like modulation effects"""
        # Ring modulation with varying frequency
        t = np.arange(len(audio)) / self.sample_rate
        mod_freq = 8 + 3 * np.sin(2 * np.pi * 0.5 * t)  # Varying modulation
        modulator = np.sin(2 * np.pi * mod_freq * t)
        
        return audio * (1 + 0.4 * modulator)
    
    def _apply_horror_distortion(self, audio: np.ndarray) -> np.ndarray:
        """Apply horror-style distortion and filtering"""
        # Soft clipping distortion
        drive = 3.0
        distorted = np.tanh(drive * audio) / np.tanh(drive)
        
        # Low-pass filter for darker sound
        nyquist = self.sample_rate / 2
        cutoff = 2000  # Hz
        b, a = signal.butter(3, cutoff/nyquist, btype='low')
        filtered = signal.filtfilt(b, a, distorted)
        
        return filtered * 0.8
    
    def _apply_radio_compression(self, audio: np.ndarray) -> np.ndarray:
        """Apply radio-style compression"""
        # Simple dynamic range compression
        threshold = 0.3
        ratio = 4.0
        
        abs_audio = np.abs(audio)
        compressed = np.where(abs_audio > threshold,
                            threshold + (abs_audio - threshold) / ratio,
                            abs_audio)
        
        return np.sign(audio) * compressed
    
    def _apply_vocoder_effect(self, audio: np.ndarray) -> np.ndarray:
        """Apply computer-like vocoder effect"""
        # Band-pass filtering into multiple bands
        num_bands = 8
        nyquist = self.sample_rate / 2
        
        # Define frequency bands
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
            t = np.arange(len(audio)) / self.sample_rate
            carrier = np.sin(2 * np.pi * carrier_freq * t)
            
            # Apply envelope to carrier
            vocoded += envelope * carrier
        
        return vocoded * 0.3
    
    def _apply_echo_effect(self, audio: np.ndarray, delay: float = 0.3, 
                          decay: float = 0.5) -> np.ndarray:
        """Apply echo effect"""
        delay_samples = int(delay * self.sample_rate)
        
        if delay_samples >= len(audio):
            return audio
        
        echo = np.zeros_like(audio)
        echo[delay_samples:] = audio[:-delay_samples] * decay
        
        return audio + echo
    
    def _apply_reverb_effect(self, audio: np.ndarray) -> np.ndarray:
        """Apply simple reverb effect"""
        # Create multiple delayed and attenuated copies
        reverb_audio = audio.copy()
        
        delays = [0.03, 0.07, 0.15, 0.25]  # seconds
        gains = [0.3, 0.2, 0.15, 0.1]
        
        for delay, gain in zip(delays, gains):
            delay_samples = int(delay * self.sample_rate)
            if delay_samples < len(audio):
                delayed = np.zeros_like(audio)
                delayed[delay_samples:] = audio[:-delay_samples] * gain
                reverb_audio += delayed
        
        return reverb_audio
    
    def process_audio_chunk(self, audio: np.ndarray, settings: dict) -> np.ndarray:
        """Process audio chunk with all effects"""
        processed = audio.copy()
        
        # Apply noise reduction first
        if settings.get('noise_reduction_enabled', False):
            processed = self.apply_noise_reduction(processed)
        
        # Apply voice effects
        if settings.get('voice_change_enabled', False):
            effect = settings.get('voice_effect', 'none')
            custom_pitch = settings.get('pitch_shift', 0.0)
            processed = self.apply_voice_effect(processed, effect, custom_pitch)
        
        # Normalize to prevent clipping
        if np.max(np.abs(processed)) > 0:
            processed = processed / np.max(np.abs(processed)) * 0.9
        
        return processed


class VirtualAudioDevice:
    """Simulate virtual audio device functionality"""
    
    def __init__(self):
        self.is_active = False
        self.input_device = None
        self.output_device = None
        self.processing_enabled = False
        
    def start_virtual_device(self, input_device_id: Optional[int] = None, 
                           output_device_id: Optional[int] = None) -> bool:
        """Start virtual audio device (simulation)"""
        try:
            self.input_device = input_device_id
            self.output_device = output_device_id
            self.is_active = True
            self.processing_enabled = True
            
            logging.info("Virtual audio device started (simulation)")
            return True
        except Exception as e:
            logging.error(f"Error starting virtual audio device: {e}")
            return False
    
    def stop_virtual_device(self):
        """Stop virtual audio device"""
        self.is_active = False
        self.processing_enabled = False
        logging.info("Virtual audio device stopped")
    
    def get_status(self) -> dict:
        """Get virtual device status"""
        return {
            'active': self.is_active,
            'input_device': self.input_device,
            'output_device': self.output_device,
            'processing_enabled': self.processing_enabled
        }


# Initialize global instances
voice_processor = AdvancedVoiceProcessor()
virtual_device = VirtualAudioDevice()