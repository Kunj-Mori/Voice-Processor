#!/bin/bash
set -e
# Build the frontend
cd frontend
yarn install --frozen-lockfile
yarn build
cd ..
# No move is needed; backend/server.py serves frontend/build directly
