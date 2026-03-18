#!/usr/bin/env bash
# Reflektionsarkiv – startskript (Unix/macOS)
# Portar: backend 8000, frontend 5173
# Kör från projektroten: ./scripts/start.sh

set -e
BACKEND_PORT=8000
FRONTEND_PORT=5173
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo ""
echo "=== Tyda – Start ==="
echo ""

# 1. Hitta och frigör portar
kill_port() {
    local port=$1
    local pids=""
    if command -v lsof &>/dev/null; then
        pids=$(lsof -ti ":$port" 2>/dev/null || true)
    fi
    if [ -n "$pids" ]; then
        echo "[Port $port] Stoppar process(er): $pids"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 2
    else
        echo "[Port $port] Ledig"
    fi
}

kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT
echo ""

# 2. Starta backend
BACKEND_DIR="$ROOT/backend"
VENV_PYTHON="$BACKEND_DIR/venv/bin/python"

if [ ! -f "$VENV_PYTHON" ]; then
    echo "FEL: Hittar inte venv. Kör först: cd backend && python -m venv venv && pip install -r requirements.txt"
    exit 1
fi

echo "[Backend] Startar uvicorn på port $BACKEND_PORT..."
cd "$BACKEND_DIR"
# Kör utan --reload för ett stabilt slutpass.
"$VENV_PYTHON" -m uvicorn app.main:app --host 127.0.0.1 --port $BACKEND_PORT &
BACKEND_PID=$!
echo "[Backend] PID $BACKEND_PID"

for _ in $(seq 1 20); do
    if curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
        break
    fi
    sleep 0.5
done

if ! curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
    echo "FEL: Backend svarar inte på http://127.0.0.1:$BACKEND_PORT/api/health"
    kill -9 "$BACKEND_PID" 2>/dev/null || true
    exit 1
fi

# 3. Starta frontend
FRONTEND_DIR="$ROOT/frontend"
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "[Frontend] Första gången – kör npm install..."
    (cd "$FRONTEND_DIR" && npm install)
fi

echo ""
echo "[Frontend] Startar Vite på port $FRONTEND_PORT..."
echo ""
echo "  Backend:  http://127.0.0.1:$BACKEND_PORT"
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo ""
echo "  Tryck Ctrl+C för att stoppa. Backend (PID $BACKEND_PID) fortsätter köra."
echo ""

cd "$FRONTEND_DIR"
exec npm run dev
