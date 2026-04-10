.PHONY: install install-backend install-frontend dev backend frontend

# ── Install ───────────────────────────────────────────────────────────────────

install: install-backend install-frontend

install-backend:
	@echo "→ Installing backend dependencies..."
	cd backend && python3 -m venv .venv && .venv/bin/pip install -q --upgrade pip && .venv/bin/pip install -r requirements.txt
	@echo "✓ Backend ready"

install-frontend:
	@echo "→ Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✓ Frontend ready"

# ── Dev ───────────────────────────────────────────────────────────────────────

dev:
	@echo "→ Starting Thadata Analytics (backend + frontend)..."
	@make -j2 backend frontend

backend:
	@echo "→ FastAPI on http://localhost:8000"
	cd backend && .venv/bin/python main.py

frontend:
	@echo "→ Next.js on http://localhost:3000"
	cd frontend && npm run dev

# ── Utilities ─────────────────────────────────────────────────────────────────

clean:
	rm -rf backend/.venv backend/uploads/* backend/data/*
	rm -rf frontend/.next frontend/node_modules

docs:
	@echo ""
	@echo "  Thadata Analytics"
	@echo "  ──────────────────────────────────────────"
	@echo "  make install    → install all dependencies"
	@echo "  make dev        → run backend + frontend"
	@echo "  make backend    → run FastAPI only"
	@echo "  make frontend   → run Next.js only"
	@echo "  make clean      → reset build artifacts"
	@echo ""
