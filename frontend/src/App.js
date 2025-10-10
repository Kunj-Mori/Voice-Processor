import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');

function App() {
  // State management
  const [activeTab, setActiveTab] = useState('live');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [processingLatency, setProcessingLatency] = useState(0);
  
  // Recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessingRecording, setIsProcessingRecording] = useState(false);
  
  // Voice comparison state
  const [originalAudio, setOriginalAudio] = useState(null);
  const [processedAudio, setProcessedAudio] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  
  // UI state
  const [theme, setTheme] = useState('dark'); // 'dark' or 'light'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState('live');
  
  // Visualizer state
  const [visualizerMode, setVisualizerMode] = useState('waveform'); // 'waveform', 'spectrum', 'bars'
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [audioData, setAudioData] = useState([]);
  const [frequencyData, setFrequencyData] = useState([]);
  const [canvasRef, setCanvasRef] = useState(null);
  const [uploadedAudioFile, setUploadedAudioFile] = useState(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  
  // Presets state
  const [presets, setPresets] = useState([
    {
      id: 'professional',
      name: 'Professional Voice',
      description: 'Clean, professional voice for meetings and presentations.',
      settings: {
        voice_effect: 'none',
        pitch_shift: 0,
        formant_shift: 1.0,
        brightness: 1.0,
        noise_reduction_enabled: true,
        voice_change_enabled: false,
        echo_enabled: false,
        reverb_enabled: false
      },
      isDefault: true
    },
    {
      id: 'gaming',
      name: 'Gaming Voice',
      description: 'Enhanced voice for gaming and streaming.',
      settings: {
        voice_effect: 'deep_radio',
        pitch_shift: -2,
        formant_shift: 0.9,
        brightness: 1.1,
        noise_reduction_enabled: true,
        voice_change_enabled: true,
        echo_enabled: false,
        reverb_enabled: true
      },
      isDefault: true
    },
    {
      id: 'creative',
      name: 'Creative Voice',
      description: 'Fun and creative voice effects.',
      settings: {
        voice_effect: 'alien',
        pitch_shift: 0,
        formant_shift: 1.5,
        brightness: 0.8,
        noise_reduction_enabled: false,
        voice_change_enabled: true,
        echo_enabled: true,
        reverb_enabled: false
      },
      isDefault: true
    }
  ]);
  const [showCreatePreset, setShowCreatePreset] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  
  // Toast notification state
  const [toast, setToast] = useState(null);
  
  // Batch processing state
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchHistory, setBatchHistory] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  // Toast notification functions
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };

  const Toast = ({ toast }) => {
    if (!toast) return null;

    const getToastStyles = () => {
      switch (toast.type) {
        case 'success':
          return 'bg-green-600 border-green-500 text-white';
        case 'error':
          return 'bg-red-600 border-red-500 text-white';
        case 'info':
          return 'bg-blue-600 border-blue-500 text-white';
        case 'warning':
          return 'bg-yellow-600 border-yellow-500 text-white';
        default:
          return 'bg-gray-600 border-gray-500 text-white';
      }
    };

    const getIcon = () => {
      switch (toast.type) {
        case 'success':
          return '✅';
        case 'error':
          return '❌';
        case 'info':
          return 'ℹ️';
        case 'warning':
          return '⚠️';
        default:
          return '📢';
      }
    };

    return (
      <div className="fixed top-4 right-4 z-50 animate-slide-in">
        <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg ${getToastStyles()}`}>
          <span className="text-lg">{getIcon()}</span>
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-white hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };
  
  // System control state
  const [virtualDeviceStatus, setVirtualDeviceStatus] = useState({ active: false });
  const [selectedInputDevice, setSelectedInputDevice] = useState('');
  const [selectedOutputDevice, setSelectedOutputDevice] = useState('');
  const [availableInputDevices, setAvailableInputDevices] = useState([]);
  const [availableOutputDevices, setAvailableOutputDevices] = useState([]);
  
  // Enhanced settings - optimized for all voice effects
  const [settings, setSettings] = useState({
    noise_reduction_enabled: false, // Disabled to focus on voice effects
    voice_change_enabled: true,     // Enabled for voice effects
    voice_effect: 'female',         // Default voice effect
    pitch_shift: 2,                 // Slight pitch shift for noticeable effect
    formant_shift: 1.2,             // Moderate formant shift for voice change
    brightness: 1.1,                // Slight brightness increase
    echo_enabled: false,            // Echo disabled by default
    echo_delay: 0.3,
    echo_decay: 0.5,
    reverb_enabled: false,          // Reverb disabled by default
    reverb_room_size: 0.5,
    system_wide_enabled: false,
    virtual_device_active: false
  });
  
  // File processing
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedProcessedAudio, setUploadedProcessedAudio] = useState(null);
  const [processingTime, setProcessingTime] = useState(0);
  
  // Voice effects
  const [availableEffects, setAvailableEffects] = useState([]);
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const websocketRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // Recording refs
  const recordingMediaRecorderRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Initialize
  useEffect(() => {
    initializeApp();
    return cleanup;
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize audio context for real-time processing
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000,
        latencyHint: 'interactive'
      });
      
      // Resume audio context if suspended (required by some browsers)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      console.log('Audio context initialized with sample rate:', audioContextRef.current.sampleRate);
      
      // Load available voice effects
      const effectsResponse = await axios.get(`${API}/voice-effects`);
      setAvailableEffects(effectsResponse.data.effects);
      
      // Load virtual device status
      const deviceResponse = await axios.get(`${API}/virtual-device-status`);
      setVirtualDeviceStatus(deviceResponse.data);
      
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };

  const cleanup = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  // WebSocket management
  const connectWebSocket = () => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    websocketRef.current = new WebSocket(`${WS_URL}/ws/audio-enhanced`);
    
    websocketRef.current.onopen = () => {
      setConnectionStatus('connected');
      console.log('Enhanced WebSocket connected');
      
      // Subscribe to virtual device updates
      websocketRef.current.send(JSON.stringify({
        type: 'virtual_device_subscribe'
      }));
    };
    
    websocketRef.current.onclose = () => {
      setConnectionStatus('disconnected');
      console.log('WebSocket disconnected');
    };
    
    websocketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
    };
    
    websocketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'processed_audio') {
        // Play processed audio in real-time
        playProcessedAudioRealtime(data.audio_data);
        if (data.processing_latency) {
          setProcessingLatency(data.processing_latency * 1000); // Convert to ms
        }
      } else if (data.type === 'virtual_device_status') {
        setVirtualDeviceStatus(data.status);
      }
    };
  };

  const playProcessedAudio = async (audioBase64) => {
    try {
      // Convert base64 back to Float32Array
      const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
      const audioData = new Float32Array(audioBytes.buffer);
      
      // Create an audio buffer with the correct sample rate
      const audioBuffer = audioContextRef.current.createBuffer(1, audioData.length, 16000);
      audioBuffer.copyToChannel(audioData, 0);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (error) {
      console.error('Error playing processed audio:', error);
    }
  };

  const playProcessedAudioRealtime = async (audioBase64) => {
    try {
      // Convert base64 back to Float32Array
      const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
      const audioData = new Float32Array(audioBytes.buffer);
      
      // Create an audio buffer with the correct sample rate
      const audioBuffer = audioContextRef.current.createBuffer(1, audioData.length, 16000);
      audioBuffer.copyToChannel(audioData, 0);
      
      // Create a buffer source for real-time playback
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      
      // Add a gain node for volume control and feedback prevention
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 0.7; // Lower volume to prevent feedback
      
      // Add a compressor to prevent audio spikes
      const compressor = audioContextRef.current.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      
      // Connect: source -> gain -> compressor -> destination
      source.connect(gainNode);
      gainNode.connect(compressor);
      compressor.connect(audioContextRef.current.destination);
      
      // Start playback immediately with minimal delay
      source.start(0);
      
      // Clean up when finished
      source.onended = () => {
        try {
          source.disconnect();
          gainNode.disconnect();
          compressor.disconnect();
        } catch (e) {
          // Ignore cleanup errors
        }
      };
      
      console.log('Real-time audio played:', audioData.length, 'samples');
      
    } catch (error) {
      console.error('Error playing real-time processed audio:', error);
    }
  };

  // Recording functions
  const startRecording = async () => {
    try {
      // Ensure audio context is resumed for real-time playback
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log('Audio context resumed for real-time processing');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: false
        } 
      });
      
      streamRef.current = stream;
      
      // Set up audio analysis
      const audioContext = audioContextRef.current;
      const source = audioContext.createMediaStreamSource(stream);
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Monitor audio level
      const monitorAudioLevel = () => {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        
        if (isRecording) {
          requestAnimationFrame(monitorAudioLevel);
        }
      };
      
      // Set up real-time audio processing using ScriptProcessorNode
      const bufferSize = 4096;
      const processor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      
      processor.onaudioprocess = (event) => {
          if (websocketRef.current?.readyState === WebSocket.OPEN) {
          const inputBuffer = event.inputBuffer;
          const inputData = inputBuffer.getChannelData(0);
          
          // Convert Float32Array to base64
          const audioBytes = new Uint8Array(inputData.buffer);
          const audioBase64 = btoa(String.fromCharCode(...audioBytes));
              
              websocketRef.current.send(JSON.stringify({
                type: 'audio_data',
                audio_data: audioBase64
              }));
        }
      };
      
      // Connect the processor
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      // Store processor reference for cleanup
      mediaRecorderRef.current = processor;
      
      connectWebSocket();
      setIsRecording(true);
      monitorAudioLevel();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error accessing microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Disconnect the processor
      if (mediaRecorderRef.current.disconnect) {
        mediaRecorderRef.current.disconnect();
      }
      setIsRecording(false);
      setAudioLevel(0);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      audioChunksRef.current = [];
    }
  };

  // Voice Recording Functions
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: false
        } 
      });
      
      recordingStreamRef.current = stream;
      recordingChunksRef.current = [];
      
      // Set up MediaRecorder for recording
      const options = { mimeType: 'audio/webm;codecs=opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'audio/mp4';
        }
      }
      
      recordingMediaRecorderRef.current = new MediaRecorder(stream, options);
      
      recordingMediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };
      
      recordingMediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
        
        // Create blob URL for immediate playback
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);
        
        // Store original audio for comparison
        setOriginalAudio(audioUrl);
        setProcessedAudio(null); // Reset processed audio
        setShowComparison(false); // Hide comparison initially
        
        // Log recording info
        console.log('Recording stopped. Duration:', recordingDuration, 'seconds');
        console.log('Audio blob size:', audioBlob.size, 'bytes');
        console.log('Audio URL created:', audioUrl);
      };
      
      recordingMediaRecorderRef.current.start();
      setIsRecordingVoice(true);
      setRecordingDuration(0);
      
      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          console.log('Recording duration:', prev + 1);
          return prev + 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error starting voice recording:', error);
      alert('Error accessing microphone. Please check permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (recordingMediaRecorderRef.current && isRecordingVoice) {
      recordingMediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const processRecordedVoice = async () => {
    if (!recordedAudio) return;
    
    setIsProcessingRecording(true);
    
    try {
      // Convert blob URL to actual blob for upload
      const response = await fetch(recordedAudio);
      const audioBlob = await response.blob();
      
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('settings', JSON.stringify(settings));
      
      console.log('Uploading audio blob, size:', audioBlob.size, 'bytes');
      
      const apiResponse = await axios.post(`${API}/process-audio-enhanced`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'json'
      });
      
      if (apiResponse.data.success) {
        const audioBytes = Uint8Array.from(atob(apiResponse.data.audio_data), c => c.charCodeAt(0));
        const processedAudioBlob = new Blob([audioBytes], { type: 'audio/wav' });
        
        // Create a new blob URL for the processed audio
        const processedAudioUrl = URL.createObjectURL(processedAudioBlob);
        setRecordedAudio(processedAudioUrl);
        
        // Store processed audio for comparison
        setProcessedAudio(processedAudioUrl);
        setShowComparison(true); // Show comparison after processing
        
        console.log('Audio processed successfully, size:', processedAudioBlob.size, 'bytes');
        console.log('Processed audio URL:', processedAudioUrl);
      } else {
        alert('Error processing recording: ' + apiResponse.data.message);
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      alert('Error processing recording. Please try again.');
    } finally {
      setIsProcessingRecording(false);
    }
  };

  const downloadProcessedVoice = () => {
    if (recordedAudio) {
      try {
        const link = document.createElement('a');
        link.href = recordedAudio;
        link.download = `processed_voice_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.wav`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Download initiated for:', recordedAudio);
      } catch (error) {
        console.error('Download error:', error);
        alert('Error downloading file. Please try again.');
      }
    } else {
      alert('No audio to download. Please record and process audio first.');
    }
  };

  const clearRecording = () => {
    // Clean up blob URLs to prevent memory leaks
    if (recordedAudio && recordedAudio.startsWith('blob:')) {
      URL.revokeObjectURL(recordedAudio);
    }
    if (originalAudio && originalAudio.startsWith('blob:')) {
      URL.revokeObjectURL(originalAudio);
    }
    if (processedAudio && processedAudio.startsWith('blob:')) {
      URL.revokeObjectURL(processedAudio);
    }
    
    setRecordedAudio(null);
    setOriginalAudio(null);
    setProcessedAudio(null);
    setShowComparison(false);
    setRecordingDuration(0);
    recordingChunksRef.current = [];
  };

  const toggleComparison = () => {
    setShowComparison(!showComparison);
  };

  const downloadOriginalAudio = () => {
    if (originalAudio) {
      const link = document.createElement('a');
      link.href = originalAudio;
      link.download = `original_voice_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const downloadProcessedAudio = () => {
    if (processedAudio) {
      const link = document.createElement('a');
      link.href = processedAudio;
      link.download = `processed_voice_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.wav`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Settings update
  const updateSettings = (newSettings) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Send to WebSocket if connected
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: 'settings_update',
        settings: updatedSettings
      }));
    }
  };

  // Virtual device controls
  const startVirtualDevice = async () => {
    try {
      const response = await axios.post(`${API}/virtual-device/start`, {
        input_device: selectedInputDevice,
        output_device: selectedOutputDevice
      });
      
      if (response.data.success) {
        updateSettings({ virtual_device_active: true });
      }
    } catch (error) {
      console.error('Error starting virtual device:', error);
      alert('Error starting virtual device');
    }
  };

  const stopVirtualDevice = async () => {
    try {
      const response = await axios.post(`${API}/virtual-device/stop`);
      
      if (response.data.success) {
        updateSettings({ virtual_device_active: false });
      }
    } catch (error) {
      console.error('Error stopping virtual device:', error);
    }
  };

  // File processing
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      setUploadedProcessedAudio(null);
    }
  };

  const processUploadedFile = async () => {
    if (!uploadedFile) return;
    
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('settings', JSON.stringify(settings));
      
      const endpoint = uploadedFile.type.startsWith('video/') ? 
        `${API}/process-video-enhanced` : `${API}/process-audio-enhanced`;
      
      const response = await axios.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: uploadedFile.type.startsWith('video/') ? 'blob' : 'json'
      });
      
      if (uploadedFile.type.startsWith('video/')) {
        const videoBlob = response.data;
        const videoUrl = URL.createObjectURL(videoBlob);
        setUploadedProcessedAudio(videoUrl);
      } else {
        if (response.data.success) {
          const audioBlob = new Blob([
            Uint8Array.from(atob(response.data.audio_data), c => c.charCodeAt(0))
          ], { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setUploadedProcessedAudio(audioUrl);
          setProcessingTime(response.data.processing_time || 0);
        } else {
          alert('Error processing file: ' + response.data.message);
        }
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Panel Components
  const SettingsPanel = ({ settings, updateSettings, theme }) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-blue-400">Voice Settings</h3>
      
      {/* Noise Reduction */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.noise_reduction_enabled}
            onChange={(e) => updateSettings({ noise_reduction_enabled: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm">🔇 Noise Reduction</span>
        </label>
      </div>

      {/* Voice Effects */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.voice_change_enabled}
            onChange={(e) => updateSettings({ voice_change_enabled: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm">🎭 Voice Effects</span>
        </label>
        <select
          value={settings.voice_effect}
          onChange={(e) => updateSettings({ voice_effect: e.target.value })}
          className={`w-full p-2 rounded text-sm ${theme.input} border ${theme.border}`}
          disabled={!settings.voice_change_enabled}
        >
          <option value="none">None</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="robotic">Robotic</option>
          <option value="alien">Alien</option>
        </select>
      </div>

      {/* Pitch Shift */}
      <div className="space-y-2">
        <label className="text-sm">🎵 Pitch: {settings.pitch_shift}</label>
        <input
          type="range"
          min="-12"
          max="12"
          value={settings.pitch_shift}
          onChange={(e) => updateSettings({ pitch_shift: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Formant Shift */}
      <div className="space-y-2">
        <label className="text-sm">🗣️ Formant: {settings.formant_shift.toFixed(1)}x</label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={settings.formant_shift}
          onChange={(e) => updateSettings({ formant_shift: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Echo */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.echo_enabled}
            onChange={(e) => updateSettings({ echo_enabled: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm">🔊 Echo</span>
        </label>
      </div>
    </div>
  );

  const LiveModePanel = ({ isRecording, audioLevel, connectionStatus, startRecording, stopRecording, processingLatency, settings, updateSettings, theme }) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-blue-400">Live Processing</h3>
      
      {/* Quick Voice Effects */}
      <div className="grid grid-cols-2 gap-2">
        {['female', 'male', 'robotic', 'alien'].map((effect) => (
          <button
            key={effect}
            onClick={() => updateSettings({ voice_effect: effect, voice_change_enabled: true })}
            className={`px-2 py-1 rounded text-xs ${
              settings.voice_effect === effect ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
            }`}
          >
            {effect}
          </button>
        ))}
      </div>

      {/* Audio Level */}
      <div className="space-y-2">
        <label className="text-sm">Audio Level: {Math.round(audioLevel)}%</label>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-100"
            style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
          />
        </div>
      </div>

      {/* Connection Status */}
      <div className="text-sm">
        Status: <span className={connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}>{connectionStatus}</span>
      </div>

      {/* Recording Button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`w-full py-2 px-4 rounded font-medium ${
          isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}
      >
        {isRecording ? '⏹️ Stop' : '🎙️ Start'} Live Processing
      </button>

      {isRecording && processingLatency > 0 && (
        <div className="text-xs text-gray-400">
          Latency: {processingLatency.toFixed(1)}ms
        </div>
      )}
    </div>
  );

  const RecordModePanel = ({ 
    isRecordingVoice, recordedAudio, recordingDuration, isProcessingRecording,
    startVoiceRecording, stopVoiceRecording, processRecordedVoice, downloadProcessedVoice, clearRecording,
    originalAudio, processedAudio, showComparison, toggleComparison, downloadOriginalAudio, downloadProcessedAudio,
    settings, theme 
  }) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-blue-400">Voice Recording</h3>
      
      {/* Recording Controls */}
      <button
        onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
        className={`w-full py-2 px-4 rounded font-medium ${
          isRecordingVoice ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}
      >
        {isRecordingVoice ? '⏹️ Stop' : '🎤 Start'} Recording
      </button>

      {isRecordingVoice && (
        <div className="text-sm text-center">
          Recording: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
        </div>
      )}

      {recordedAudio && (
        <div className="space-y-2">
          <button
            onClick={processRecordedVoice}
            disabled={isProcessingRecording}
            className={`w-full py-2 px-4 rounded font-medium ${
              isProcessingRecording ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {isProcessingRecording ? '⏳ Processing...' : '🚀 Apply Effects'}
          </button>
          
          <button
            onClick={downloadProcessedVoice}
            className="w-full py-2 px-4 rounded font-medium bg-blue-600 hover:bg-blue-700 text-white"
          >
            📥 Download
          </button>
          
          <button
            onClick={clearRecording}
            className="w-full py-2 px-4 rounded font-medium bg-red-600 hover:bg-red-700 text-white"
          >
            🗑️ Clear
          </button>
        </div>
      )}
    </div>
  );

  const UploadModePanel = ({ uploadedFile, uploadedProcessedAudio, processingTime, isProcessing, handleFileUpload, processUploadedFile, theme }) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-blue-400">File Upload</h3>
      
      <input
        type="file"
        accept="audio/*,video/*"
        onChange={handleFileUpload}
        className="w-full text-sm"
      />

      {uploadedFile && (
        <div className="space-y-2">
          <div className="text-sm">File: {uploadedFile.name}</div>
          <button
            onClick={processUploadedFile}
            disabled={isProcessing}
            className={`w-full py-2 px-4 rounded font-medium ${
              isProcessing ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isProcessing ? '⏳ Processing...' : '🚀 Process File'}
          </button>
        </div>
      )}

      {processingTime > 0 && (
        <div className="text-xs text-gray-400">
          Processed in: {processingTime.toFixed(2)}s
        </div>
      )}
    </div>
  );

  const SystemControlPanel = ({ 
    virtualDeviceStatus, selectedInputDevice, selectedOutputDevice, availableInputDevices, availableOutputDevices,
    setSelectedInputDevice, setSelectedOutputDevice, startVirtualDevice, stopVirtualDevice, theme 
  }) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-blue-400">System Control</h3>
      
      {/* Input Device */}
      <div className="space-y-2">
        <label className="text-sm">Input Device</label>
        <select
          value={selectedInputDevice}
          onChange={(e) => setSelectedInputDevice(e.target.value)}
          className={`w-full p-2 rounded text-sm ${theme.input} border ${theme.border}`}
        >
          {availableInputDevices.map((device) => (
            <option key={device.device_id} value={device.device_id}>
              {device.name}
            </option>
          ))}
        </select>
      </div>

      {/* Output Device */}
      <div className="space-y-2">
        <label className="text-sm">Output Device</label>
        <select
          value={selectedOutputDevice}
          onChange={(e) => setSelectedOutputDevice(e.target.value)}
          className={`w-full p-2 rounded text-sm ${theme.input} border ${theme.border}`}
        >
          {availableOutputDevices.map((device) => (
            <option key={device.device_id} value={device.device_id}>
              {device.name}
            </option>
          ))}
        </select>
      </div>

      {/* Virtual Device */}
      <button
        onClick={virtualDeviceStatus.active ? stopVirtualDevice : startVirtualDevice}
        className={`w-full py-2 px-4 rounded font-medium ${
          virtualDeviceStatus.active ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}
      >
        {virtualDeviceStatus.active ? '⏹️ Stop' : '▶️ Start'} Virtual Device
      </button>
    </div>
  );

  // Audio Visualizer Functions
  const startVisualization = () => {
    setIsVisualizing(true);
    // Start audio analysis when recording starts
  };

  const stopVisualization = () => {
    setIsVisualizing(false);
    setAudioData([]);
    setFrequencyData([]);
  };

  const drawWaveform = (canvas, data) => {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);
    
    if (data.length === 0) return;
    
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const sliceWidth = width / data.length;
    let x = 0;
    
    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * height / 2) + height / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.stroke();
  };

  const drawSpectrum = (canvas, data) => {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);
    
    if (data.length === 0) return;
    
    const barWidth = width / data.length;
    
    for (let i = 0; i < data.length; i++) {
      const barHeight = (data[i] / 255) * height;
      const hue = (i / data.length) * 360;
      
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
    }
  };

  const drawBars = (canvas, data) => {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);
    
    if (data.length === 0) return;
    
    const barCount = Math.min(32, data.length);
    const barWidth = width / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * data.length);
      const barHeight = (data[dataIndex] / 255) * height;
      
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(1, '#60a5fa');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
    }
  };

  const updateVisualization = () => {
    if (!canvasRef || !isVisualizing) return;
    
    const canvas = canvasRef;
    
    switch (visualizerMode) {
      case 'waveform':
        drawWaveform(canvas, audioData);
        break;
      case 'spectrum':
        drawSpectrum(canvas, frequencyData);
        break;
      case 'bars':
        drawBars(canvas, frequencyData);
        break;
    }
  };

  // Generate sample data for demonstration
  const generateSampleData = () => {
    const sampleData = [];
    const sampleFreq = [];
    
    for (let i = 0; i < 256; i++) {
      // Generate sine wave with some noise
      const time = Date.now() * 0.01;
      const value = Math.sin(time + i * 0.1) * 50 + Math.random() * 20 - 10;
      sampleData.push(Math.max(0, Math.min(255, value + 128)));
      sampleFreq.push(Math.random() * 255);
    }
    
    setAudioData(sampleData);
    setFrequencyData(sampleFreq);
  };

  // Effect to update visualization when data changes
  useEffect(() => {
    updateVisualization();
  }, [audioData, frequencyData, visualizerMode, isVisualizing]);

  // Effect to generate sample data when visualizer is active
  useEffect(() => {
    if (activeSidebarTab === 'visualizer' && isVisualizing) {
      const interval = setInterval(generateSampleData, 50);
      return () => clearInterval(interval);
    }
  }, [activeSidebarTab, isVisualizing]);

  // Preset Management Functions
  const loadPreset = (presetId) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      updateSettings(preset.settings);
      showToast(`Preset "${preset.name}" loaded successfully!`, 'success');
    }
  };

  const createPreset = () => {
    if (!newPresetName.trim()) {
      showToast('Please enter a preset name', 'warning');
      return;
    }

    const newPreset = {
      id: Date.now().toString(),
      name: newPresetName,
      description: newPresetDescription || 'Custom voice preset',
      settings: { ...settings },
      isDefault: false
    };

    setPresets([...presets, newPreset]);
    setNewPresetName('');
    setNewPresetDescription('');
    setShowCreatePreset(false);
    showToast(`Preset "${newPreset.name}" created successfully!`, 'success');
  };

  const updatePreset = (presetId) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset && !preset.isDefault) {
      const updatedPreset = {
        ...preset,
        settings: { ...settings }
      };
      setPresets(presets.map(p => p.id === presetId ? updatedPreset : p));
      showToast(`Preset "${preset.name}" updated successfully!`, 'success');
    } else {
      showToast('Cannot update default presets', 'warning');
    }
  };

  const deletePreset = (presetId) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset && !preset.isDefault) {
      if (window.confirm(`Delete preset "${preset.name}"?`)) {
        setPresets(presets.filter(p => p.id !== presetId));
        showToast(`Preset "${preset.name}" deleted successfully!`, 'success');
      }
    } else {
      showToast('Cannot delete default presets', 'warning');
    }
  };

  const startEditingPreset = (presetId) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset && !preset.isDefault) {
      setEditingPreset(preset);
      setNewPresetName(preset.name);
      setNewPresetDescription(preset.description);
    } else {
      showToast('Cannot edit default presets', 'warning');
    }
  };

  const saveEditedPreset = () => {
    if (!newPresetName.trim()) {
      showToast('Please enter a preset name', 'warning');
      return;
    }

    const updatedPreset = {
      ...editingPreset,
      name: newPresetName,
      description: newPresetDescription,
      settings: { ...settings }
    };

    setPresets(presets.map(p => p.id === editingPreset.id ? updatedPreset : p));
    setEditingPreset(null);
    setNewPresetName('');
    setNewPresetDescription('');
    showToast(`Preset "${updatedPreset.name}" updated successfully!`, 'success');
  };

  // Audio Upload Functions for Visualizer
  const handleAudioUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      setUploadedAudioFile(file);
      processUploadedAudio(file);
    } else {
      showToast('Please select a valid audio file', 'error');
    }
  };

  const processUploadedAudio = async (file) => {
    setIsProcessingUpload(true);
    
    try {
      // Create audio context for analysis
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Extract audio data
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      
      // Convert to visualization data
      const samples = [];
      const frequencies = [];
      
      // Downsample for visualization
      const step = Math.floor(channelData.length / 256);
      for (let i = 0; i < 256; i++) {
        const index = i * step;
        const sample = channelData[index] || 0;
        samples.push(Math.max(0, Math.min(255, (sample + 1) * 127.5)));
        frequencies.push(Math.abs(sample) * 255);
      }
      
      setAudioData(samples);
      setFrequencyData(frequencies);
      setIsVisualizing(true);
      
      showToast(`Audio file "${file.name}" loaded successfully!`, 'success');
    } catch (error) {
      console.error('Error processing audio:', error);
      showToast('Error processing audio file', 'error');
    } finally {
      setIsProcessingUpload(false);
    }
  };

  // Batch Processing Functions
  const handleBatchFileSelect = (event) => {
    const files = Array.from(event.target.files);
    addFilesToBatch(files);
  };

  const handleBatchFileDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    addFilesToBatch(files);
  };

  const addFilesToBatch = (files) => {
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
    if (audioFiles.length === 0) {
      showToast('Please select valid audio files', 'warning');
      return;
    }

    const newFiles = audioFiles.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      name: file.name,
      size: file.size,
      status: 'pending', // pending, processing, completed, error
      progress: 0,
      processedFile: null,
      error: null
    }));

    setBatchFiles(prev => [...prev, ...newFiles]);
    showToast(`${audioFiles.length} file(s) added to batch queue`, 'success');
  };

  const removeFileFromBatch = (fileId) => {
    setBatchFiles(prev => prev.filter(file => file.id !== fileId));
    showToast('File removed from batch queue', 'info');
  };

  const clearBatchQueue = () => {
    setBatchFiles([]);
    setBatchProgress(0);
    showToast('Batch queue cleared', 'info');
  };

  const startBatchProcessing = async () => {
    if (batchFiles.length === 0) {
      showToast('No files to process', 'warning');
      return;
    }

    setBatchProcessing(true);
    setBatchProgress(0);

    const processedFiles = [];
    
    for (let i = 0; i < batchFiles.length; i++) {
      const file = batchFiles[i];
      
      // Update file status to processing
      setBatchFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'processing' } : f
      ));

      try {
        // Simulate processing with progress updates
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setBatchFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, progress } : f
          ));
        }

        // Create processed file (simulated)
        const processedFile = {
          ...file,
          name: `processed_${file.name}`,
          size: file.size * 0.9, // Simulate compression
          processedAt: new Date().toISOString()
        };

        // Update file status to completed
        setBatchFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: 'completed', 
            progress: 100,
            processedFile 
          } : f
        ));

        processedFiles.push(processedFile);
        
        // Update overall progress
        const overallProgress = ((i + 1) / batchFiles.length) * 100;
        setBatchProgress(overallProgress);

      } catch (error) {
        // Update file status to error
        setBatchFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: 'error', 
            error: error.message 
          } : f
        ));
      }
    }

    // Add to history
    const batchJob = {
      id: Date.now(),
      files: processedFiles,
      processedAt: new Date().toISOString(),
      status: 'completed'
    };
    setBatchHistory(prev => [batchJob, ...prev]);

    setBatchProcessing(false);
    showToast(`Batch processing completed! ${processedFiles.length} files processed`, 'success');
  };

  const downloadProcessedFile = (fileId) => {
    const file = batchFiles.find(f => f.id === fileId);
    if (file && file.processedFile) {
      // Create download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(file.processedFile);
      link.download = file.processedFile.name;
      link.click();
      showToast(`Downloaded ${file.processedFile.name}`, 'success');
    }
  };

  const downloadAllProcessed = () => {
    const completedFiles = batchFiles.filter(f => f.status === 'completed' && f.processedFile);
    if (completedFiles.length === 0) {
      showToast('No processed files to download', 'warning');
      return;
    }

    completedFiles.forEach(file => {
      setTimeout(() => downloadProcessedFile(file.id), 100);
    });
    
    showToast(`Downloading ${completedFiles.length} processed files`, 'info');
  };

  const getFileStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '📄';
    }
  };

  const getFileStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'processing': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Clean Sidebar Content Component
  const SidebarContent = ({ activeTab, setActiveTab }) => {
    const sidebarTabs = [
      { id: 'settings', name: 'Settings', icon: '⚙️' },
      { id: 'live', name: 'Live Mode', icon: '🎙️' },
      { id: 'record', name: 'Record', icon: '🎤' },
      { id: 'upload', name: 'Upload', icon: '📁' },
      { id: 'visualizer', name: 'Visualizer', icon: '📊' },
      { id: 'presets', name: 'Presets', icon: '🎛️' },
      { id: 'batch', name: 'Batch', icon: '⚡' },
      { id: 'system', name: 'System', icon: '🔧' }
    ];

  return (
      <div className="p-4">
        {/* Clean Sidebar Navigation */}
        <div className="space-y-2">
          {sidebarTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors min-h-[48px] ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-gray-700 text-gray-300'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Theme classes - simplified to black, white, and blue only
  const themeClasses = {
    dark: {
      bg: 'bg-black',
      sidebar: 'bg-gray-900 border-gray-800',
      card: 'bg-gray-900',
      text: 'text-white',
      textSecondary: 'text-gray-300',
      border: 'border-gray-800',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      input: 'bg-gray-800 border-gray-700 text-white'
    },
    light: {
      bg: 'bg-white',
      sidebar: 'bg-gray-100 border-blue-200',
      card: 'bg-white',
      text: 'text-black',
      textSecondary: 'text-gray-600',
      border: 'border-blue-200',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      input: 'bg-white border-blue-300 text-black'
    }
  };

  const currentTheme = themeClasses[theme];

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:block lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-80' : 'w-16'} transition-all duration-300 ${currentTheme.sidebar} border-r ${currentTheme.border} flex flex-col lg:relative lg:translate-x-0 ${!sidebarOpen ? 'lg:w-16' : 'lg:w-80'} md:fixed md:top-0 md:left-0 md:h-full md:z-50 md:transform ${sidebarOpen ? 'md:translate-x-0' : 'md:-translate-x-full'}`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-800 flex-shrink-0">
            <div className="align-vertical-center justify-between h-12">
              {sidebarOpen && (
                <h1 className="text-xl font-bold text-blue-400 align-vertical-center">
                  🎙️ Voice Processor
                </h1>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="sidebar-button p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>


          {/* Sidebar Navigation */}
          {sidebarOpen && (
            <div className="flex-1 overflow-y-auto">
              <SidebarContent 
                activeTab={activeSidebarTab}
                setActiveTab={setActiveSidebarTab}
              />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:ml-0 lg:ml-0">
          {/* Main Header */}
          <header className="p-6 border-b border-gray-800 md:p-4 sm:p-3">
            <div className="header-content flex items-center justify-between h-full">
              <div className="flex items-center">
                <div className="header-title">
                  <h1 className="text-3xl font-bold text-blue-400 md:text-2xl sm:text-xl leading-tight">
                    Advanced Voice Processor
                  </h1>
                  <p className="text-gray-400 mt-1 md:text-sm sm:text-xs leading-tight">
                    Real-time voice effects, noise reduction, and audio processing
                  </p>
                </div>
              </div>
              
              {/* Theme Toggle - Top Right Corner */}
              <div className="align-vertical-center space-x-2 md:space-x-1 h-full">
                <button
                  onClick={() => setTheme('light')}
                  className={`theme-toggle px-4 py-2 rounded-lg text-sm font-medium transition-all md:px-3 md:py-1.5 md:text-xs flex items-center justify-center min-h-[40px] ${
                    theme === 'light' 
                      ? 'bg-blue-600 text-white shadow-lg active' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span className="flex items-center justify-center">
                    <span className="md:hidden">☀️ Light</span>
                    <span className="hidden md:inline text-lg">☀️</span>
                  </span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`theme-toggle px-4 py-2 rounded-lg text-sm font-medium transition-all md:px-3 md:py-1.5 md:text-xs flex items-center justify-center min-h-[40px] ${
                    theme === 'dark' 
                      ? 'bg-blue-600 text-white shadow-lg active' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span className="flex items-center justify-center">
                    <span className="md:hidden">🌙 Dark</span>
                    <span className="hidden md:inline text-lg">🌙</span>
                  </span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="flex-1 p-6 overflow-y-auto md:p-4 sm:p-2">
            {/* Main Content based on active sidebar tab */}
            {activeSidebarTab === 'settings' && (
              <div className="max-w-4xl mx-auto">
                <div className={`${currentTheme.card} rounded-lg p-8 shadow-lg md:p-6 sm:p-4`}>
                  <h2 className="text-3xl font-bold mb-8 text-center text-blue-400">⚙️ Voice Processing Settings</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-8 sm:gap-6">
                    <div className="space-y-8">
                      {/* Noise Reduction */}
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={settings.noise_reduction_enabled}
                            onChange={(e) => updateSettings({ noise_reduction_enabled: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-lg font-medium">🔇 Noise Reduction</span>
                        </label>
                        <p className="text-sm text-gray-400 ml-8">ML-powered background noise removal</p>
                      </div>
          
                      {/* Voice Effects */}
                      <div className="space-y-4">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={settings.voice_change_enabled}
                            onChange={(e) => updateSettings({ voice_change_enabled: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-lg font-medium">🎭 Voice Effects</span>
                        </label>
                        <select
                          value={settings.voice_effect}
                          onChange={(e) => updateSettings({ voice_effect: e.target.value })}
                          className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 text-white"
                          disabled={!settings.voice_change_enabled}
                        >
                          <option value="none">🎤 None (Original Voice)</option>
                          <option value="female">👩 Female Voice</option>
                          <option value="male">👨 Male Voice</option>
                          <option value="girl">👧 Girl Voice</option>
                          <option value="baby">👶 Baby Voice</option>
                          <option value="old_man">👴 Old Man Voice</option>
                          <option value="alien">👽 Alien Voice</option>
                          <option value="robotic">🤖 Robotic Voice</option>
                          <option value="horror">👻 Horror Voice</option>
                          <option value="cartoon">🎭 Cartoon Voice</option>
                          <option value="deep_radio">📻 Deep Radio Voice</option>
                          <option value="computer">💻 Computer Voice</option>
                          <option value="echo">🔊 Echo Effect</option>
                          <option value="wall_echo">🏠 Wall Echo</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* Pitch Shift */}
                      <div className="space-y-4">
                        <label className="block text-lg font-medium">
                          🎵 Pitch Shift: {settings.pitch_shift} semitones
                        </label>
                        <div className="space-y-2">
                          <input
                            type="range"
                            min="-12"
                            max="12"
                            step="1"
                            value={settings.pitch_shift}
                            onChange={(e) => updateSettings({ pitch_shift: Number(e.target.value) })}
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <div className="flex justify-between text-sm text-gray-400 px-1">
                            <span>-12</span>
                            <span>0</span>
                            <span>+12</span>
                          </div>
                        </div>
                      </div>

                      {/* Formant Shift */}
                      <div className="space-y-4">
                        <label className="block text-lg font-medium">
                          🗣️ Formant Shift: {settings.formant_shift.toFixed(1)}x
                        </label>
                        <div className="space-y-2">
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={settings.formant_shift}
                            onChange={(e) => updateSettings({ formant_shift: Number(e.target.value) })}
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <div className="flex justify-between text-sm text-gray-400 px-1">
                            <span>0.5x</span>
                            <span>1.0x</span>
                            <span>2.0x</span>
                          </div>
                        </div>
                      </div>

                      {/* Brightness */}
                      <div className="space-y-4">
                        <label className="block text-lg font-medium">
                          ✨ Brightness: {settings.brightness.toFixed(1)}x
                        </label>
                        <div className="space-y-2">
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={settings.brightness}
                            onChange={(e) => updateSettings({ brightness: Number(e.target.value) })}
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <div className="flex justify-between text-sm text-gray-400 px-1">
                            <span>0.5x</span>
                            <span>1.0x</span>
                            <span>2.0x</span>
                          </div>
                        </div>
                      </div>

                      {/* Echo Effect */}
                      <div className="space-y-4">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={settings.echo_enabled}
                            onChange={(e) => updateSettings({ echo_enabled: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-lg font-medium">🔊 Echo Effect</span>
                        </label>
                        {settings.echo_enabled && (
                          <div className="space-y-4 ml-8">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium">
                                Delay: {settings.echo_delay}s
                              </label>
                              <input
                                type="range"
                                min="0.1"
                                max="1.0"
                                step="0.1"
                                value={settings.echo_delay}
                                onChange={(e) => updateSettings({ echo_delay: Number(e.target.value) })}
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium">
                                Decay: {settings.echo_decay}
                              </label>
                              <input
                                type="range"
                                min="0.1"
                                max="0.9"
                                step="0.1"
                                value={settings.echo_decay}
                                onChange={(e) => updateSettings({ echo_decay: Number(e.target.value) })}
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Reverb Effect */}
                      <div className="space-y-4">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={settings.reverb_enabled}
                            onChange={(e) => updateSettings({ reverb_enabled: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-lg font-medium">🏠 Reverb Effect</span>
                        </label>
                        {settings.reverb_enabled && (
                          <div className="space-y-2 ml-8">
                            <label className="block text-sm font-medium">
                              Room Size: {settings.reverb_room_size}
                            </label>
                            <input
                              type="range"
                              min="0.1"
                              max="1.0"
                              step="0.1"
                              value={settings.reverb_room_size}
                              onChange={(e) => updateSettings({ reverb_room_size: Number(e.target.value) })}
                              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSidebarTab === 'live' && (
              <div className="max-w-4xl mx-auto">
                <div className={`${currentTheme.card} rounded-lg p-8 text-center shadow-lg md:p-6 sm:p-4`}>
                  <h2 className="text-3xl font-bold mb-6">🎙️ Real-time Voice Processing</h2>
                  
                  {/* Audio Level Meter */}
                  <div className="mb-8">
                    <div className="text-sm text-gray-400 mb-2">Audio Level</div>
                    <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-100 ${
                          audioLevel > 50 ? 'bg-red-500' : 
                          audioLevel > 25 ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-400 mt-1">{Math.round(audioLevel)}%</div>
                  </div>

                  {/* Quick Voice Effect Buttons */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-blue-300">Quick Voice Effects</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 sm:grid-cols-2">
                      {[
                        { id: 'female', name: '👩 Female', color: 'bg-blue-600 hover:bg-blue-700' },
                        { id: 'male', name: '👨 Male', color: 'bg-blue-500 hover:bg-blue-600' },
                        { id: 'robotic', name: '🤖 Robotic', color: 'bg-gray-600 hover:bg-gray-700' },
                        { id: 'alien', name: '👽 Alien', color: 'bg-gray-700 hover:bg-gray-800' }
                      ].map((effect) => (
            <button
                          key={effect.id}
                          onClick={() => updateSettings({ 
                            voice_effect: effect.id, 
                            voice_change_enabled: true,
                            pitch_shift: 2,
                            formant_shift: 1.2,
                            brightness: 1.1,
                            echo_enabled: false,
                            reverb_enabled: false
                          })}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-white ${effect.color} ${
                            settings.voice_effect === effect.id ? 'ring-2 ring-blue-400' : ''
                          } sm:px-2 sm:py-1 sm:text-xs`}
                        >
                          {effect.name}
            </button>
                      ))}
                    </div>
                    
                    {/* Quick Advanced Controls */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:grid-cols-2">
            <button
                        onClick={() => updateSettings({ echo_enabled: !settings.echo_enabled })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-white ${
                          settings.echo_enabled ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
                        } sm:px-2 sm:py-1 sm:text-xs`}
                      >
                        🔊 Echo {settings.echo_enabled ? 'ON' : 'OFF'}
            </button>
            <button
                        onClick={() => updateSettings({ reverb_enabled: !settings.reverb_enabled })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-white ${
                          settings.reverb_enabled ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'
                        } sm:px-2 sm:py-1 sm:text-xs`}
                      >
                        🏠 Reverb {settings.reverb_enabled ? 'ON' : 'OFF'}
                      </button>
                      <button
                        onClick={() => updateSettings({ pitch_shift: settings.pitch_shift === 0 ? 3 : 0 })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-white ${
                          settings.pitch_shift !== 0 ? 'bg-blue-400 hover:bg-blue-500' : 'bg-gray-600 hover:bg-gray-700'
                        } sm:px-2 sm:py-1 sm:text-xs`}
                      >
                        🎵 Pitch {settings.pitch_shift !== 0 ? '+' + settings.pitch_shift : 'OFF'}
                      </button>
                      <button
                        onClick={() => updateSettings({ formant_shift: settings.formant_shift === 1.0 ? 1.5 : 1.0 })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-white ${
                          settings.formant_shift !== 1.0 ? 'bg-blue-300 hover:bg-blue-400' : 'bg-gray-600 hover:bg-gray-700'
                        } sm:px-2 sm:py-1 sm:text-xs`}
                      >
                        🗣️ Formant {settings.formant_shift !== 1.0 ? settings.formant_shift.toFixed(1) + 'x' : 'OFF'}
            </button>
          </div>
        </div>

                  {/* Recording Controls */}
                  <div className="space-y-4">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={connectionStatus === 'error'}
                      className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                        isRecording
                          ? 'bg-red-600 hover:bg-red-700 text-white recording-pulse'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      } ${connectionStatus === 'error' ? 'opacity-50 cursor-not-allowed' : ''} md:px-6 md:py-3 md:text-base sm:px-4 sm:py-2 sm:text-sm`}
                    >
                      {isRecording ? '⏹️ Stop Processing' : '🎙️ Start Real-time Processing'}
                    </button>
                    
                    {isRecording && (
                      <div className="text-sm text-gray-400 animate-pulse">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-blue-400 font-medium">LIVE PROCESSING ACTIVE</span>
                        </div>
                        <p>🔄 Your voice is being processed and played back in real-time...</p>
                        {processingLatency > 0 && (
                          <div className="mt-1 text-xs text-blue-300">
                            Processing Latency: {processingLatency.toFixed(1)}ms
                          </div>
                        )}
                        <div className="mt-2 text-xs text-white">
                          🔊 You should hear your processed voice through your speakers/headphones
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Instructions */}
                  <div className="mt-8 text-sm text-gray-400">
                    <p className="mb-2">🎙️ <strong>Complete Real-time Voice Processing:</strong></p>
                    <ul className="text-left space-y-1 max-w-md mx-auto">
                      <li>• <strong>1. Select a voice effect</strong> (Female, Male, Robotic, Alien)</li>
                      <li>• <strong>2. Toggle advanced effects</strong> (Echo, Reverb, Pitch, Formant)</li>
                      <li>• <strong>3. Click "Start Real-time Processing"</strong></li>
                      <li>• <strong>4. Speak into your microphone</strong></li>
                      <li>• <strong>5. Hear all effects applied in real-time!</strong></li>
                    </ul>
                    <div className="mt-4 p-3 bg-blue-900 bg-opacity-50 rounded-lg border border-blue-500">
                      <p className="text-blue-300 font-medium">
                        🎭 <strong>All Advanced Controls Available!</strong>
                      </p>
                      <p className="text-xs text-blue-200 mt-1">
                        Use voice effects, pitch shift, formant shift, brightness, echo, and reverb in real-time
                      </p>
                    </div>
                    <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-600">
                      <p className="text-white font-medium">
                        🔊 <strong>Make sure your speakers/headphones are ON!</strong>
                      </p>
                      <p className="text-xs text-gray-300 mt-1">
                        You will hear your processed voice with all effects through your audio output
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSidebarTab === 'record' && (
              <div className="max-w-4xl mx-auto">
                <VoiceRecordingMode
                  isRecordingVoice={isRecordingVoice}
                  recordedAudio={recordedAudio}
                  recordingDuration={recordingDuration}
                  isProcessingRecording={isProcessingRecording}
                  startVoiceRecording={startVoiceRecording}
                  stopVoiceRecording={stopVoiceRecording}
                  processRecordedVoice={processRecordedVoice}
                  downloadProcessedVoice={downloadProcessedVoice}
                  clearRecording={clearRecording}
                  settings={settings}
                  originalAudio={originalAudio}
                  processedAudio={processedAudio}
                  showComparison={showComparison}
                  toggleComparison={toggleComparison}
                  downloadOriginalAudio={downloadOriginalAudio}
                  downloadProcessedAudio={downloadProcessedAudio}
                />
              </div>
            )}

            {activeSidebarTab === 'upload' && (
              <div className="max-w-4xl mx-auto">
                <UploadMode
                  uploadedFile={uploadedFile}
                  processedAudio={uploadedProcessedAudio}
                  isProcessing={isProcessing}
                  processingTime={processingTime}
                  handleFileUpload={handleFileUpload}
                  processUploadedFile={processUploadedFile}
                />
              </div>
            )}

            {activeSidebarTab === 'visualizer' && (
              <div className="max-w-6xl mx-auto">
                {/* Audio Visualizer */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-blue-400 mb-2">📊 Audio Visualizer</h2>
                  <p className="text-gray-400 text-sm">Real-time audio analysis and visualization</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
                  {/* Control Panel */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-3 sm:space-y-0">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {visualizerMode === 'waveform' && '🌊 Waveform'}
                        {visualizerMode === 'spectrum' && '📈 Spectrum'}
                        {visualizerMode === 'bars' && '📊 Bars'}
                      </h3>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setVisualizerMode('waveform')}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          visualizerMode === 'waveform' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Waveform
                      </button>
                      <button 
                        onClick={() => setVisualizerMode('spectrum')}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          visualizerMode === 'spectrum' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Spectrum
                      </button>
                      <button 
                        onClick={() => setVisualizerMode('bars')}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          visualizerMode === 'bars' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        Bars
                      </button>
                    </div>
                  </div>
                  
                  {/* Visualization Canvas */}
                  <div className="bg-gray-900 rounded-lg p-3 border border-gray-600">
                    <canvas
                      ref={setCanvasRef}
                      width={800}
                      height={300}
                      className="w-full h-48 bg-gradient-to-br from-gray-900 to-gray-800 rounded border border-gray-500"
                    />
                  </div>
                  
                  {/* Control Buttons */}
                  <div className="mt-4 flex flex-wrap justify-center gap-4">
                    <button
                      onClick={isVisualizing ? stopVisualization : startVisualization}
                      className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        isVisualizing 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {isVisualizing ? '⏹️ Stop Visualization' : '▶️ Start Visualization'}
                    </button>
                    
                    <button
                      onClick={generateSampleData}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
                    >
                      🎲 Generate Sample Data
                    </button>
                    
                    <label className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all cursor-pointer">
                      📁 Upload Audio File
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        className="hidden"
                      />
                    </label>
                    
                    {uploadedAudioFile && (
                      <button
                        onClick={() => {
                          setUploadedAudioFile(null);
                          setAudioData([]);
                          setFrequencyData([]);
                          setIsVisualizing(false);
                        }}
                        className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all"
                      >
                        🗑️ Clear Upload
                      </button>
                    )}
                  </div>
                  
                  {/* Upload Status */}
                  {isProcessingUpload && (
                    <div className="mt-4 text-center">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                      <p className="mt-2 text-sm text-purple-400">Processing audio file...</p>
                    </div>
                  )}
                  
                  {uploadedAudioFile && (
                    <div className="mt-4 text-center">
                      <div className="inline-flex items-center px-4 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        <span className="text-sm text-purple-400">
                          Loaded: {uploadedAudioFile.name}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Bar */}
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded ${
                        isVisualizing 
                          ? 'bg-green-900/30 border border-green-500/30' 
                          : 'bg-gray-900/30 border border-gray-500/30'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          isVisualizing ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                        }`}></div>
                        <span className={`text-xs ${
                          isVisualizing ? 'text-green-400' : 'text-gray-400'
                        }`}>
                          {isVisualizing ? 'Live Data' : 'No Data'}
                        </span>
                      </div>
                      
                      {isVisualizing && (
                      <div className="flex items-center space-x-2 px-3 py-1 bg-blue-900/30 border border-blue-500/30 rounded">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-blue-400">Visualizing</span>
                      </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Mode: {visualizerMode.charAt(0).toUpperCase() + visualizerMode.slice(1)}
                    </div>
                  </div>
                </div>
                
                {/* Instructions */}
                <div className="mt-4 bg-gray-700 rounded-lg p-4 border border-gray-600">
                  <h4 className="text-sm font-semibold text-white mb-3">💡 How to Use</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <div className="text-blue-300 font-medium mb-1">🌊 Waveform</div>
                      <p className="text-gray-400">Shows audio waves over time with smooth curves</p>
                    </div>
                    <div>
                      <div className="text-blue-300 font-medium mb-1">📈 Spectrum</div>
                      <p className="text-gray-400">Frequency content analysis with colorful bars</p>
                    </div>
                    <div>
                      <div className="text-blue-300 font-medium mb-1">📊 Bars</div>
                      <p className="text-gray-400">Simple frequency bars with gradient effects</p>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-blue-900/20 border border-blue-500/30 rounded text-center">
                    <p className="text-xs text-blue-300">
                      <strong>Tip:</strong> Click "Start Visualization" to see live demo data, or connect to real audio for actual visualization!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSidebarTab === 'presets' && (
              <div className="max-w-6xl mx-auto">
                {/* Preset Manager */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-blue-400 mb-2">🎛️ Preset Manager</h2>
                  <p className="text-gray-400 text-sm">Save and manage your voice effect configurations</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Your Voice Presets</h3>
                    </div>
                    <button 
                      onClick={() => setShowCreatePreset(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                      + Create Preset
                    </button>
                  </div>

                  {/* Create Preset Modal */}
                  {showCreatePreset && (
                    <div className="mb-6 bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <h4 className="text-lg font-semibold text-white mb-4">Create New Preset</h4>
                      <div className="space-y-4">
                          <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Preset Name</label>
                          <input
                            type="text"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            placeholder="Enter preset name..."
                            className="w-full p-3 bg-gray-600 rounded-lg border border-gray-500 text-white placeholder-gray-400 focus:border-blue-500"
                          />
                          </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                          <textarea
                            value={newPresetDescription}
                            onChange={(e) => setNewPresetDescription(e.target.value)}
                            placeholder="Enter description..."
                            rows={3}
                            className="w-full p-3 bg-gray-600 rounded-lg border border-gray-500 text-white placeholder-gray-400 focus:border-blue-500"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={createPreset}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all"
                          >
                            ✅ Create Preset
                          </button>
                          <button
                            onClick={() => {
                              setShowCreatePreset(false);
                              setNewPresetName('');
                              setNewPresetDescription('');
                            }}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-all"
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      </div>
                          </div>
                  )}

                  {/* Edit Preset Modal */}
                  {editingPreset && (
                    <div className="mb-6 bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <h4 className="text-lg font-semibold text-white mb-4">Edit Preset: {editingPreset.name}</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Preset Name</label>
                          <input
                            type="text"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            className="w-full p-3 bg-gray-600 rounded-lg border border-gray-500 text-white focus:border-blue-500"
                          />
                          </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                          <textarea
                            value={newPresetDescription}
                            onChange={(e) => setNewPresetDescription(e.target.value)}
                            rows={3}
                            className="w-full p-3 bg-gray-600 rounded-lg border border-gray-500 text-white focus:border-blue-500"
                          />
                          </div>
                        <div className="flex gap-3">
                          <button
                            onClick={saveEditedPreset}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all"
                          >
                            ✅ Save Changes
                          </button>
                          <button
                            onClick={() => {
                              setEditingPreset(null);
                              setNewPresetName('');
                              setNewPresetDescription('');
                            }}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-all"
                          >
                            ❌ Cancel
                          </button>
                          </div>
                        </div>
                      </div>
                  )}

                  {/* Presets Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {presets.map((preset) => (
                      <div key={preset.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-blue-500/50 transition-all duration-300">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                            <div className="text-2xl">
                              {preset.settings.voice_effect === 'none' && '🎤'}
                              {preset.settings.voice_effect === 'deep_radio' && '🎮'}
                              {preset.settings.voice_effect === 'alien' && '👽'}
                              {preset.settings.voice_effect === 'female' && '👩'}
                              {preset.settings.voice_effect === 'male' && '👨'}
                              {preset.settings.voice_effect === 'robotic' && '🤖'}
                              {!['none', 'deep_radio', 'alien', 'female', 'male', 'robotic'].includes(preset.settings.voice_effect) && '🎭'}
                            </div>
                          <div>
                              <h4 className="text-white font-semibold text-sm">{preset.name}</h4>
                              <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                                preset.isDefault 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-green-600 text-white'
                              }`}>
                                {preset.isDefault ? 'Default' : 'Custom'}
                              </span>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                            {!preset.isDefault && (
                              <>
                                <button 
                                  onClick={() => startEditingPreset(preset.id)}
                                  className="text-gray-400 hover:text-blue-400 text-sm transition-colors" 
                                  title="Edit preset"
                                >
                            ✏️
                          </button>
                                <button 
                                  onClick={() => updatePreset(preset.id)}
                                  className="text-gray-400 hover:text-green-400 text-sm transition-colors" 
                                  title="Update with current settings"
                                >
                                  🔄
                                </button>
                                <button 
                                  onClick={() => deletePreset(preset.id)}
                                  className="text-gray-400 hover:text-red-400 text-sm transition-colors" 
                                  title="Delete preset"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                            {preset.isDefault && (
                              <button 
                                onClick={() => updatePreset(preset.id)}
                                className="text-gray-400 hover:text-green-400 text-sm transition-colors" 
                                title="Update with current settings"
                              >
                                🔄
                              </button>
                            )}
                        </div>
                      </div>
                        <p className="text-gray-300 text-xs mb-3">{preset.description}</p>
                      <div className="bg-gray-800 rounded p-3 mb-3">
                        <h5 className="text-xs font-semibold text-blue-300 mb-2">Settings:</h5>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Effect:</span>
                              <span className="text-white">{preset.settings.voice_effect}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Pitch:</span>
                              <span className="text-white">{preset.settings.pitch_shift}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Formant:</span>
                              <span className="text-white">{preset.settings.formant_shift}x</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Brightness:</span>
                              <span className="text-white">{preset.settings.brightness}x</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-gray-400">Noise Reduction:</span>
                              <span className="text-white">{preset.settings.noise_reduction_enabled ? 'ON' : 'OFF'}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-gray-400">Echo:</span>
                              <span className="text-white">{preset.settings.echo_enabled ? 'ON' : 'OFF'}</span>
                          </div>
                          </div>
                          </div>
                        <button 
                          onClick={() => loadPreset(preset.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-medium transition-all"
                        >
                          Load Preset
                      </button>
                    </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSidebarTab === 'batch' && (
              <div className="max-w-6xl mx-auto">
                {/* Batch Processor */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-blue-400 mb-2">⚡ Batch Processor</h2>
                  <p className="text-gray-400 text-sm">Process multiple audio files simultaneously</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Batch Processing</h3>
                    </div>
                    <div className="flex gap-2">
                      <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer">
                      Select Files
                        <input
                          type="file"
                          multiple
                          accept="audio/*"
                          onChange={handleBatchFileSelect}
                          className="hidden"
                        />
                      </label>
                      {batchFiles.length > 0 && (
                        <button
                          onClick={clearBatchQueue}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        >
                          Clear Queue
                    </button>
                      )}
                    </div>
                  </div>

                  {/* File Upload Zone */}
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                      dragOver 
                        ? 'border-blue-500 bg-blue-900/20' 
                        : 'border-gray-600 hover:border-blue-500'
                    }`}
                    onDrop={handleBatchFileDrop}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => document.querySelector('input[type="file"]').click()}
                  >
                    <div className="text-4xl mb-4">📁</div>
                    <p className="text-lg text-gray-300 mb-2">Drop audio files here or click to browse</p>
                    <p className="text-sm text-gray-500">Supports MP3, WAV, M4A, and other audio formats</p>
                  </div>

                  {/* Batch Queue */}
                  {batchFiles.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-white">Processing Queue ({batchFiles.length} files)</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={startBatchProcessing}
                            disabled={batchProcessing}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              batchProcessing
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            {batchProcessing ? '🔄 Processing...' : '▶️ Start Processing'}
                          </button>
                          {batchFiles.some(f => f.status === 'completed') && (
                            <button
                              onClick={downloadAllProcessed}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all"
                            >
                              📥 Download All
                            </button>
                          )}
                        </div>
                    </div>
                    
                      {/* Overall Progress */}
                      {batchProcessing && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-400 mb-2">
                            <span>Overall Progress</span>
                            <span>{Math.round(batchProgress)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${batchProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* File List */}
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {batchFiles.map((file) => (
                          <div key={file.id} className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <span className="text-lg">{getFileStatusIcon(file.status)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">{file.name}</p>
                                <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                              </div>
                              <span className={`text-sm font-medium ${getFileStatusColor(file.status)}`}>
                                {file.status === 'processing' ? `${file.progress}%` : file.status}
                              </span>
                            </div>
                            
                            {/* Progress Bar for Processing Files */}
                            {file.status === 'processing' && (
                              <div className="w-32 ml-4">
                                <div className="w-full bg-gray-600 rounded-full h-1">
                                  <div 
                                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                    style={{ width: `${file.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2 ml-4">
                              {file.status === 'completed' && (
                                <button
                                  onClick={() => downloadProcessedFile(file.id)}
                                  className="text-green-400 hover:text-green-300 text-sm transition-colors"
                                  title="Download processed file"
                                >
                                  📥
                                </button>
                              )}
                              {file.status === 'error' && (
                                <span className="text-red-400 text-xs" title={file.error}>
                                  Error
                                </span>
                              )}
                              <button
                                onClick={() => removeFileFromBatch(file.id)}
                                className="text-gray-400 hover:text-red-400 text-sm transition-colors"
                                title="Remove from queue"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Processing History */}
                <div className="mt-6 bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Processing History</h3>
                    </div>
                    <button 
                      onClick={() => setBatchHistory([])}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      Clear History
                    </button>
                  </div>
                  
                  {batchHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-4xl mb-2">⚡</div>
                      <p>No batch processing jobs yet.</p>
                      <p className="text-sm">Upload files to start batch processing</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {batchHistory.map((job) => (
                        <div key={job.id} className="bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-green-400">✅</span>
                              <span className="text-white font-medium">
                                Batch Job #{job.id.toString().slice(-6)}
                              </span>
                  </div>
                            <span className="text-sm text-gray-400">
                              {new Date(job.processedAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400">
                            Processed {job.files.length} files successfully
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSidebarTab === 'system' && (
              <div className="max-w-4xl mx-auto">
                <SystemControl
                  virtualDeviceStatus={virtualDeviceStatus}
                  selectedInputDevice={selectedInputDevice}
                  selectedOutputDevice={selectedOutputDevice}
                  availableInputDevices={availableInputDevices}
                  availableOutputDevices={availableOutputDevices}
                  setSelectedInputDevice={setSelectedInputDevice}
                  setSelectedOutputDevice={setSelectedOutputDevice}
                  startVirtualDevice={startVirtualDevice}
                  stopVirtualDevice={stopVirtualDevice}
                  settings={settings}
                  updateSettings={updateSettings}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Toast Notifications */}
      <Toast toast={toast} />
    </div>
  );
};

export default App;

// Voice Recording Mode Component
const VoiceRecordingMode = ({ 
  isRecordingVoice, 
  recordedAudio, 
  recordingDuration, 
  isProcessingRecording,
  startVoiceRecording, 
  stopVoiceRecording, 
  processRecordedVoice, 
  downloadProcessedVoice, 
  clearRecording,
  settings,
  originalAudio,
  processedAudio,
  showComparison,
  toggleComparison,
  downloadOriginalAudio,
  downloadProcessedAudio
}) => (
  <div className="max-w-4xl mx-auto">
    <div className="bg-gray-800 rounded-lg p-8">
      <h2 className="text-3xl font-bold mb-6 text-center">🎤 Voice Recording & Processing</h2>
      
      <div className="space-y-6">
        {/* Recording Controls */}
        <div className="text-center space-y-4">
          <div className="text-lg text-gray-300 mb-4">
            Record your voice with the selected effects applied
          </div>
          
          {/* Recording Timer */}
          {isRecordingVoice && (
            <div className="text-2xl font-bold text-red-500 mb-4">
              🔴 Recording: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
            </div>
          )}
          
          {/* Recording Buttons */}
          <div className="space-x-4">
            {!isRecordingVoice ? (
              <button
                onClick={startVoiceRecording}
                className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-lg transition-all"
              >
                🎤 Start Recording
              </button>
            ) : (
              <button
                onClick={stopVoiceRecording}
                className="px-8 py-4 bg-gray-600 hover:bg-gray-700 rounded-lg font-bold text-lg transition-all"
              >
                ⏹️ Stop Recording
              </button>
            )}
          </div>
        </div>

        {/* Current Settings Display */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-bold mb-3">Current Settings:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Noise Reduction:</span>
              <span className={`ml-2 ${settings.noise_reduction_enabled ? 'text-green-400' : 'text-gray-500'}`}>
                {settings.noise_reduction_enabled ? '✅ Enabled' : '❌ Disabled'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Voice Effect:</span>
              <span className="ml-2 text-blue-400">
                {settings.voice_effect === 'none' ? 'None' : settings.voice_effect}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Pitch Shift:</span>
              <span className="ml-2 text-purple-400">
                {settings.pitch_shift} semitones
              </span>
            </div>
            <div>
              <span className="text-gray-400">Echo Effect:</span>
              <span className={`ml-2 ${settings.echo_enabled ? 'text-green-400' : 'text-gray-500'}`}>
                {settings.echo_enabled ? '✅ Enabled' : '❌ Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Recorded Audio Section */}
        {recordedAudio && (
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">🎵 Recorded Audio</h3>
            
            {/* Audio Player */}
            <div className="mb-4">
              <audio 
                controls 
                className="w-full mb-4"
                onLoadedMetadata={(e) => {
                  const duration = e.target.duration;
                  console.log('Audio duration loaded:', duration, 'seconds');
                }}
                onError={(e) => {
                  console.error('Audio loading error:', e);
                }}
              >
                <source src={recordedAudio} type="audio/webm" />
                <source src={recordedAudio} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
              <div className="text-sm text-gray-400 text-center">
                Recorded Duration: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={processRecordedVoice}
                disabled={isProcessingRecording}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  isProcessingRecording
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isProcessingRecording ? '⏳ Processing...' : '🚀 Apply Effects'}
              </button>
              
              {processedAudio && (
                <button
                  onClick={toggleComparison}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-all text-white"
                >
                  {showComparison ? '🔍 Hide Comparison' : '🔍 Show Comparison'}
                </button>
              )}
              
              <button
                onClick={downloadProcessedVoice}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all text-white"
              >
                📥 Download Processed Audio
              </button>
              
              <button
                onClick={clearRecording}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-all text-white"
              >
                🗑️ Clear Recording
              </button>
            </div>
            
            {isProcessingRecording && (
              <div className="mt-4 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                <p className="mt-2 text-sm text-gray-400">
                  Processing your voice with selected effects...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Voice Comparison Section */}
        {showComparison && originalAudio && processedAudio && (
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-6 text-center">🔍 Voice Comparison</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Audio */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-3 text-center text-blue-400">
                  🎤 Original Voice
                </h4>
                <audio 
                  controls 
                  className="w-full mb-3"
                  onLoadedMetadata={(e) => {
                    console.log('Original audio duration:', e.target.duration, 'seconds');
                  }}
                >
                  <source src={originalAudio} type="audio/webm" />
                  Your browser does not support the audio element.
                </audio>
                <div className="text-center">
                  <button
                    onClick={downloadOriginalAudio}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-all text-white"
                  >
                    📥 Download Original
                  </button>
                </div>
              </div>
              
              {/* Processed Audio */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-3 text-center text-green-400">
                  ✨ Processed Voice
                </h4>
                <audio 
                  controls 
                  className="w-full mb-3"
                  onLoadedMetadata={(e) => {
                    console.log('Processed audio duration:', e.target.duration, 'seconds');
                  }}
                >
                  <source src={processedAudio} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
                <div className="text-center">
                  <button
                    onClick={downloadProcessedAudio}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-all text-white"
                  >
                    📥 Download Processed
                  </button>
                </div>
              </div>
            </div>
            
            {/* Comparison Features */}
            <div className="mt-6 bg-gray-800 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-3 text-center">🎛️ Comparison Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-blue-400 font-medium">Original Format</div>
                  <div className="text-gray-400">WebM (16kHz)</div>
                </div>
                <div className="text-center">
                  <div className="text-green-400 font-medium">Processed Format</div>
                  <div className="text-gray-400">WAV (16kHz)</div>
                </div>
                <div className="text-center">
                  <div className="text-purple-400 font-medium">Effects Applied</div>
                  <div className="text-gray-400">
                    {settings.voice_effect !== 'none' ? settings.voice_effect : 'None'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="mt-4 flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => {
                  // Play both audios simultaneously (if supported by browser)
                  const originalPlayer = document.querySelector('audio[src*="blob:"]:first-of-type');
                  const processedPlayer = document.querySelector('audio[src*="blob:"]:last-of-type');
                  if (originalPlayer && processedPlayer) {
                    originalPlayer.play();
                    setTimeout(() => processedPlayer.play(), 100);
                  }
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-all text-white"
              >
                🎵 Play Both
              </button>
              
              <button
                onClick={() => {
                  // Stop all audio players
                  document.querySelectorAll('audio').forEach(player => {
                    player.pause();
                    player.currentTime = 0;
                  });
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm font-medium transition-all text-white"
              >
                ⏹️ Stop All
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-900 bg-opacity-50 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">📋 How to Use</h3>
          <ol className="space-y-2 text-sm">
            <li>1. Configure your voice effects in the settings above</li>
            <li>2. Click "Start Recording" to begin capturing your voice</li>
            <li>3. Speak into your microphone</li>
            <li>4. Click "Stop Recording" when finished</li>
            <li>5. Click "Apply Effects" to process with your selected settings</li>
            <li>6. Click "Show Comparison" to compare original vs processed audio</li>
            <li>7. Use "Play Both" to hear the difference simultaneously</li>
            <li>8. Download either the original or processed audio file</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
);

// Live Mode Component
const LiveMode = ({ isRecording, audioLevel, connectionStatus, startRecording, stopRecording, processingLatency, settings, updateSettings }) => (
  <div className="max-w-4xl mx-auto">
    <div className="bg-gray-800 rounded-lg p-8 text-center">
      <h2 className="text-3xl font-bold mb-6">🎙️ Real-time Voice Processing</h2>
      
      {/* Audio Level Meter */}
      <div className="mb-8">
        <div className="text-sm text-gray-400 mb-2">Audio Level</div>
        <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
          <div 
            className={`h-full transition-all duration-100 ${
              audioLevel > 50 ? 'bg-red-500' : 
              audioLevel > 25 ? 'bg-yellow-500' : 
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
          />
        </div>
        <div className="text-sm text-gray-400 mt-1">{Math.round(audioLevel)}%</div>
      </div>

        {/* Quick Voice Effect Buttons */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-center text-purple-300">Quick Voice Effects</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {[
              { id: 'female', name: '👩 Female', color: 'bg-pink-600 hover:bg-pink-700' },
              { id: 'male', name: '👨 Male', color: 'bg-blue-600 hover:bg-blue-700' },
              { id: 'robotic', name: '🤖 Robotic', color: 'bg-gray-600 hover:bg-gray-700' },
              { id: 'alien', name: '👽 Alien', color: 'bg-green-600 hover:bg-green-700' }
            ].map((effect) => (
              <button
                key={effect.id}
                onClick={() => updateSettings({ 
                  voice_effect: effect.id, 
                  voice_change_enabled: true,
                  pitch_shift: 2,        // Slight pitch shift for effect
                  formant_shift: 1.2,    // Moderate formant shift
                  brightness: 1.1,       // Slight brightness increase
                  echo_enabled: false,   // Echo disabled by default
                  reverb_enabled: false  // Reverb disabled by default
                })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-white ${effect.color} ${
                  settings.voice_effect === effect.id ? 'ring-2 ring-purple-400' : ''
                }`}
              >
                {effect.name}
              </button>
            ))}
          </div>
          
          {/* Quick Advanced Controls */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => updateSettings({ echo_enabled: !settings.echo_enabled })}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-white ${
                settings.echo_enabled ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              🔊 Echo {settings.echo_enabled ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => updateSettings({ reverb_enabled: !settings.reverb_enabled })}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-white ${
                settings.reverb_enabled ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              🏠 Reverb {settings.reverb_enabled ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => updateSettings({ pitch_shift: settings.pitch_shift === 0 ? 3 : 0 })}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-white ${
                settings.pitch_shift !== 0 ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              🎵 Pitch {settings.pitch_shift !== 0 ? '+' + settings.pitch_shift : 'OFF'}
            </button>
            <button
              onClick={() => updateSettings({ formant_shift: settings.formant_shift === 1.0 ? 1.5 : 1.0 })}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-white ${
                settings.formant_shift !== 1.0 ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              🗣️ Formant {settings.formant_shift !== 1.0 ? settings.formant_shift.toFixed(1) + 'x' : 'OFF'}
            </button>
          </div>
      </div>

      {/* Recording Controls */}
      <div className="space-y-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={connectionStatus === 'error'}
          className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700 text-white recording-pulse'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
          } ${connectionStatus === 'error' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isRecording ? '⏹️ Stop Processing' : '🎙️ Start Real-time Processing'}
        </button>
        
        {isRecording && (
          <div className="text-sm text-gray-400 animate-pulse">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-medium">LIVE PROCESSING ACTIVE</span>
            </div>
            <p>🔄 Your voice is being processed and played back in real-time...</p>
            {processingLatency > 0 && (
              <div className="mt-1 text-xs text-yellow-400">
                Processing Latency: {processingLatency.toFixed(1)}ms
          </div>
        )}
            <div className="mt-2 text-xs text-blue-300">
              🔊 You should hear your processed voice through your speakers/headphones
            </div>
          </div>
        )}
      </div>
      
      {/* Instructions */}
      <div className="mt-8 text-sm text-gray-400">
        <p className="mb-2">🎙️ <strong>Complete Real-time Voice Processing:</strong></p>
        <ul className="text-left space-y-1 max-w-md mx-auto">
          <li>• <strong>1. Select a voice effect</strong> (Female, Male, Robotic, Alien)</li>
          <li>• <strong>2. Toggle advanced effects</strong> (Echo, Reverb, Pitch, Formant)</li>
          <li>• <strong>3. Click "Start Real-time Processing"</strong></li>
          <li>• <strong>4. Speak into your microphone</strong></li>
          <li>• <strong>5. Hear all effects applied in real-time!</strong></li>
        </ul>
        <div className="mt-4 p-3 bg-purple-900 bg-opacity-50 rounded-lg border border-purple-500">
          <p className="text-purple-300 font-medium">
            🎭 <strong>All Advanced Controls Available!</strong>
          </p>
          <p className="text-xs text-purple-200 mt-1">
            Use voice effects, pitch shift, formant shift, brightness, echo, and reverb in real-time
          </p>
        </div>
        <div className="mt-3 p-3 bg-blue-900 bg-opacity-50 rounded-lg border border-blue-500">
          <p className="text-blue-300 font-medium">
            🔊 <strong>Make sure your speakers/headphones are ON!</strong>
          </p>
          <p className="text-xs text-blue-200 mt-1">
            You will hear your processed voice with all effects through your audio output
          </p>
        </div>
      </div>
    </div>
  </div>
);

// Upload Mode Component
const UploadMode = ({ uploadedFile, processedAudio, isProcessing, processingTime, handleFileUpload, processUploadedFile }) => (
  <div className="max-w-4xl mx-auto">
    <div className="bg-gray-800 rounded-lg p-8">
      <h2 className="text-3xl font-bold mb-6 text-center">📁 Enhanced File Processing</h2>
      
      <div className="space-y-6">
        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
          <input
            type="file"
            accept="audio/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer block">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-xl">
              {uploadedFile ? `📄 ${uploadedFile.name}` : '📁 Click to upload audio or video file'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supports: MP3, WAV, MP4, MOV, AVI
            </p>
          </label>
        </div>

        {/* Process Button */}
        {uploadedFile && (
          <div className="text-center space-y-4">
            <button
              onClick={processUploadedFile}
              disabled={isProcessing}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                isProcessing
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isProcessing ? '⏳ Processing with enhanced effects...' : '🚀 Process with Enhanced Effects'}
            </button>
            
            {processingTime > 0 && (
              <p className="text-sm text-gray-400">
                ⚡ Processed in {processingTime.toFixed(2)} seconds
              </p>
            )}
          </div>
        )}

        {/* Processed Result */}
        {processedAudio && (
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">✨ Enhanced Result</h3>
            {uploadedFile?.type.startsWith('video/') ? (
              <video controls className="w-full rounded-lg mb-4">
                <source src={processedAudio} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <audio controls className="w-full mb-4">
                <source src={processedAudio} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
            )}
            <div className="text-center">
              <a
                href={processedAudio}
                download={`enhanced_${uploadedFile?.name}`}
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                📥 Download Enhanced File
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

// System Control Component
const SystemControl = ({ 
  virtualDeviceStatus, 
  selectedInputDevice, 
  selectedOutputDevice,
  setSelectedInputDevice, 
  setSelectedOutputDevice,
  startVirtualDevice, 
  stopVirtualDevice,
  settings,
  updateSettings
}) => (
  <div className="max-w-4xl mx-auto">
    <div className="bg-gray-800 rounded-lg p-8">
      <h2 className="text-3xl font-bold mb-6 text-center">⚙️ System-Wide Voice Control</h2>
      
      <div className="space-y-8">
        {/* Virtual Audio Device */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">🔊 Virtual Audio Device</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Device Selection */}
            <div>
              <label className="block text-lg font-medium mb-2">Input Device</label>
              <select
                value={selectedInputDevice || ''}
                onChange={(e) => setSelectedInputDevice(Number(e.target.value))}
                className="w-full p-3 bg-gray-600 rounded-lg border border-gray-500"
              >
                <option value="">Select input device</option>
                {virtualDeviceStatus.available_devices
                  ?.filter(device => device.is_input)
                  .map(device => (
                    <option key={device.device_id} value={device.device_id}>
                      {device.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Output Device Selection */}
            <div>
              <label className="block text-lg font-medium mb-2">Output Device</label>
              <select
                value={selectedOutputDevice || ''}
                onChange={(e) => setSelectedOutputDevice(Number(e.target.value))}
                className="w-full p-3 bg-gray-600 rounded-lg border border-gray-500"
              >
                <option value="">Select output device</option>
                {virtualDeviceStatus.available_devices
                  ?.filter(device => device.is_output)
                  .map(device => (
                    <option key={device.device_id} value={device.device_id}>
                      {device.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Virtual Device Controls */}
          <div className="mt-6 text-center">
            {virtualDeviceStatus.active ? (
              <button
                onClick={stopVirtualDevice}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
              >
                🛑 Stop Virtual Device
              </button>
            ) : (
              <button
                onClick={startVirtualDevice}
                disabled={!selectedInputDevice || !selectedOutputDevice}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ▶️ Start Virtual Device
              </button>
            )}
          </div>

          {/* Status */}
          <div className="mt-4 text-center">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
              virtualDeviceStatus.active ? 'bg-green-600' : 'bg-gray-600'
            }`}>
              {virtualDeviceStatus.active ? '🟢 Virtual device active' : '⚫ Virtual device inactive'}
            </span>
          </div>
        </div>

        {/* System-wide Settings */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">🌐 System-wide Settings</h3>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.system_wide_enabled}
                onChange={(e) => updateSettings({ system_wide_enabled: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-lg">Enable system-wide voice processing</span>
            </label>
            
            <p className="text-sm text-gray-400 ml-8">
              When enabled, voice effects will be applied to all applications (Discord, Zoom, etc.)
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900 bg-opacity-50 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">📋 Instructions</h3>
          <ol className="space-y-2 text-sm">
            <li>1. Select your microphone as input device</li>
            <li>2. Select virtual audio output (VB-Cable, etc.)</li>
            <li>3. Start the virtual device</li>
            <li>4. Configure your apps to use the virtual audio device</li>
            <li>5. Enable system-wide processing</li>
            <li>6. Your voice will be processed in real-time across all apps!</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
);