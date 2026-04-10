#!/bin/bash
# Thadata Analytics — quick start script
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

# ── Colors ────────────────────────────────────────────────────────────────────
CYAN='\033[0;36m'; ORANGE='\033[0;33m'; GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'

log()  { echo -e "${CYAN}[thadata]${NC} $1"; }
ok()   { echo -e "${GREEN}✓${NC} $1"; }
err()  { echo -e "${RED}✗${NC} $1"; exit 1; }

# ── Backend setup ─────────────────────────────────────────────────────────────
if [ ! -d "$BACKEND/.venv" ]; then
  log "Creating Python virtual environment..."
  python3 -m venv "$BACKEND/.venv" || err "python3 -m venv failed"
  ok "Virtual environment created"
fi

log "Installing backend dependencies..."
"$BACKEND/.venv/bin/pip" install -q --upgrade pip
"$BACKEND/.venv/bin/pip" install -q -r "$BACKEND/requirements.txt"
ok "Backend dependencies installed"

# ── Frontend setup ────────────────────────────────────────────────────────────
if [ ! -d "$FRONTEND/node_modules" ]; then
  log "Installing frontend dependencies..."
  cd "$FRONTEND" && npm install --silent
  ok "Frontend dependencies installed"
fi

# ── Launch ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${ORANGE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${ORANGE}  Thadata Analytics${NC}"
echo -e "${ORANGE}  Backend  → http://localhost:8000${NC}"
echo -e "${ORANGE}  Frontend → http://localhost:3000${NC}"
echo -e "${ORANGE}  API Docs → http://localhost:8000/docs${NC}"
echo -e "${ORANGE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Run both in parallel, kill both on exit
trap 'kill 0' SIGINT SIGTERM EXIT

log "Starting FastAPI backend..."
cd "$BACKEND" && .venv/bin/python main.py &
BACKEND_PID=$!

log "Starting Next.js frontend..."
cd "$FRONTEND" && npm run dev &
FRONTEND_PID=$!

wait $BACKEND_PID $FRONTEND_PID
