#!/bin/bash
# CyberShield AI - Development Startup Script
# Starts both Next.js frontend and FastAPI backend

set -e

echo "🛡️  CyberShield AI - Starting Development Environment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is required but not installed.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is required but not installed.${NC}"
    exit 1
fi

# Navigate to project root
cd "$(dirname "$0")"

echo ""
echo -e "${CYAN}📦 Setting up FastAPI Backend...${NC}"

# Create Python virtual environment if it doesn't exist
if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv backend/venv
fi

# Activate virtual environment and install dependencies
source backend/venv/bin/activate
echo "Installing Python dependencies..."
pip install -q -r backend/requirements.txt 2>/dev/null || pip install -r backend/requirements.txt

# Copy env file if not exists
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env 2>/dev/null || true
fi

echo ""
echo -e "${CYAN}🚀 Starting Services...${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${CYAN}Shutting down services...${NC}"
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start FastAPI backend
echo -e "${GREEN}Starting FastAPI Backend on http://localhost:8001${NC}"
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start Next.js frontend
echo -e "${GREEN}Starting Next.js Frontend on http://localhost:8000${NC}"
npm run dev -- -p 8000 &
FRONTEND_PID=$!

echo ""
echo "=================================================="
echo -e "${GREEN}✅ CyberShield AI is running!${NC}"
echo ""
echo "  Frontend:  http://localhost:8000"
echo "  Backend:   http://localhost:8001"
echo "  API Docs:  http://localhost:8001/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=================================================="
echo ""

# Wait for processes
wait
