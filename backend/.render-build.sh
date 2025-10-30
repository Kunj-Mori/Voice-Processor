#!/bin/bash
set -e

echo "🔧 Installing system dependencies..."
apt-get update
apt-get install -y portaudio19-dev gcc libasound-dev

echo "🐍 Installing Python dependencies..."
pip install --upgrade pip
pip install wheel setuptools
pip install -r requirements.txt
