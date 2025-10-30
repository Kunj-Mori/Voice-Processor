#!/bin/bash
set -e

# Install system dependencies required for PyAudio
apt-get update && apt-get install -y portaudio19-dev

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt