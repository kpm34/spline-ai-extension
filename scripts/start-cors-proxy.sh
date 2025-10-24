#!/bin/bash

# Start CORS Proxy for Chrome Extension
# This proxy adds CORS headers to SIM.ai API responses

echo "🔧 Starting CORS Proxy for Browser Extension..."
echo ""
echo "This proxy runs on port 3004 and forwards requests to SIM.ai on port 3003"
echo "with proper CORS headers for the Chrome extension."
echo ""

cd "$(dirname "$0")/.."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

# Check if SIM.ai is running
if ! curl -s http://localhost:3003 > /dev/null 2>&1; then
    echo "⚠️  Warning: SIM.ai doesn't appear to be running on port 3003"
    echo "Make sure SIM.ai is started first with:"
    echo "  cd ~/sim && docker compose -f docker-compose.custom.yml up -d"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Start the CORS proxy
echo "Starting CORS proxy..."
docker-compose -f docker-compose.cors-proxy.yml up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ CORS Proxy started successfully!"
    echo ""
    echo "📡 Proxy running at: http://localhost:3004"
    echo "🎯 Forwarding to: http://localhost:3003"
    echo ""
    echo "To stop the proxy:"
    echo "  docker-compose -f docker-compose.cors-proxy.yml down"
    echo ""
    echo "To view logs:"
    echo "  docker-compose -f docker-compose.cors-proxy.yml logs -f"
else
    echo ""
    echo "❌ Failed to start CORS proxy"
    echo "Check the error messages above"
    exit 1
fi
