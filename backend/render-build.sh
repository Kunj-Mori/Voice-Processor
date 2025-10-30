#!/bin/bash
set -e

# Install system dependencies for PyAudio and audio processing
if [ -f "apt.txt" ]; then
  echo "🔧 Installing system dependencies..."
  xargs -a apt.txt apt-get install -y
fi

# Upgrade pip and install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
