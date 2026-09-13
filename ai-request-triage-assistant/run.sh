#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "=========================================================="
echo "   AI Request Triage Assistant - Starting Application"
echo "=========================================================="

# 1. Clean up any stale processes lingering on ports 8000 or 5173
echo "-> Freeing ports 8000 and 5173 if in use..."
PIDS_TO_KILL=$(lsof -ti:8000 -ti:5173 -ti:5174 2>/dev/null || true)
if [ -n "$PIDS_TO_KILL" ]; then
    kill -9 $PIDS_TO_KILL 2>/dev/null || true
    sleep 1
fi

# Check if GEMINI_API_KEY is configured
if [ -f "$BACKEND_DIR/.env" ]; then
    echo " [✓] Found backend .env configuration"
elif [ -n "$GEMINI_API_KEY" ]; then
    echo " [✓] GEMINI_API_KEY detected from environment"
else
    echo " [!] Note: No GEMINI_API_KEY detected in env or backend/.env."
    echo "     You can easily enter it in the web dashboard top-right button."
fi

# Cleanup child processes on exit (Ctrl+C)
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 2. Launch FastAPI backend
echo ""
echo "-> Launching FastAPI backend on http://localhost:8000..."
cd "$BACKEND_DIR"
PYTHONPATH=. "$BACKEND_DIR/venv/bin/python" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Wait for FastAPI to become ready
echo "-> Waiting for backend to initialize..."
READY=0
for i in {1..20}; do
    if curl -s http://127.0.0.1:8000/health >/dev/null 2>&1; then
        READY=1
        break
    fi
    sleep 0.5
done

if [ $READY -eq 0 ]; then
    echo " [X] Error: FastAPI backend failed to start on port 8000. Please check logs above."
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi
echo " [✓] FastAPI backend is live and healthy!"

# 3. Launch React frontend
echo "-> Launching React + Material UI frontend on http://localhost:5173..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo " Application is running successfully!"
echo "   Dashboard:    http://localhost:5173"
echo "   API Docs:     http://localhost:8000/docs"
echo "   Health Check: http://localhost:8000/health"
echo "=========================================================="
echo "Press Ctrl+C to stop both servers."

wait
