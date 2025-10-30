#!/bin/bash
set -e

echo "🐍 Installing Python dependencies..."
pip install --upgrade pip
pip install wheel setuptools
pip install -r requirements.txt
