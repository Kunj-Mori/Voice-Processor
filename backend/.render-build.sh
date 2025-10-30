#!/bin/bash
set -e

echo "🔧 Installing system dependencies..."
sudo apt-get update -y
sudo apt-get install -y portaudio19-dev python3-dev build-essential

echo "🐍 Installing Python dependencies..."
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

echo "✅ Build completed successfully."
