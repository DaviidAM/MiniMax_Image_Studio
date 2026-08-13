.PHONY: install install-backend install-frontend dev backend frontend test clean

# ── helpers ────────────────────────────────────────────────────────────────
MINIMAX_API_KEY ?= $(shell grep -o 'MINIMAX_API_KEY=[^ ]*' ~/.hermes/.env 2>/dev/null | cut -d= -f2)

# ── install ────────────────────────────────────────────────────────────────
install: install-backend install-frontend

install-backend:
	cd backend && pip install -r requirements.txt

install-frontend:
	cd frontend && npm install

# ── run ───────────────────────────────────────────────────────────────────
dev: install
	@echo "Starting backend on http://localhost:8000 ..."
	@MINIMAX_API_KEY=$(MINIMAX_API_KEY) uvicorn backend.main:app --reload --port 8000 &

	@echo "Starting frontend on http://localhost:3000 ..."
	cd frontend && npm run dev

backend:
	MINIMAX_API_KEY=$(MINIMAX_API_KEY) uvicorn backend.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

# ── build ─────────────────────────────────────────────────────────────────
build-frontend:
	cd frontend && npm run build

# ── test ───────────────────────────────────────────────────────────────────
test:
	npm --prefix frontend run lint

clean:
	cd frontend && npm run clean 2>/dev/null || true
	rm -rf backend/__pycache__ backend/.pytest_cache
