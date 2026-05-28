.PHONY: dev build up down logs migrate seed shell-db shell-backend lint test help

# ─── Colours ──────────────────────────────────────────────────────────────────
BOLD  := \033[1m
RESET := \033[0m
CYAN  := \033[36m

# ─── Development ──────────────────────────────────────────────────────────────

## Start all services with hot-reload (dev profile)
dev:
	@echo "$(CYAN)$(BOLD)Starting iTrade in development mode...$(RESET)"
	docker compose --profile dev up --build

## Start dev services in background
dev-d:
	@echo "$(CYAN)$(BOLD)Starting iTrade dev in background...$(RESET)"
	docker compose --profile dev up --build -d

# ─── Production ───────────────────────────────────────────────────────────────

## Build all Docker images
build:
	@echo "$(CYAN)$(BOLD)Building Docker images...$(RESET)"
	docker compose build

## Start production stack (postgres + redis + backend-prod + frontend + nginx)
up:
	@echo "$(CYAN)$(BOLD)Starting iTrade in production mode...$(RESET)"
	docker compose up -d

## Stop all running containers
down:
	@echo "$(CYAN)$(BOLD)Stopping iTrade services...$(RESET)"
	docker compose --profile dev down

## Stop and remove volumes (WARNING: destroys database data)
down-v:
	@echo "$(BOLD)Removing containers and volumes — all data will be lost!$(RESET)"
	docker compose --profile dev down -v

# ─── Logs ─────────────────────────────────────────────────────────────────────

## Tail logs from all running services
logs:
	docker compose logs -f

## Tail logs from backend only
logs-backend:
	docker compose logs -f backend backend-prod

## Tail logs from frontend only
logs-frontend:
	docker compose logs -f frontend frontend-dev

# ─── Database ─────────────────────────────────────────────────────────────────

## Run Alembic migrations (upgrade to head)
migrate:
	@echo "$(CYAN)$(BOLD)Running database migrations...$(RESET)"
	docker compose exec backend-prod alembic upgrade head 2>/dev/null || \
	docker compose exec backend alembic upgrade head

## Create a new Alembic migration (usage: make migration MSG="add foo table")
migration:
	@echo "$(CYAN)$(BOLD)Creating migration: $(MSG)$(RESET)"
	docker compose exec backend-prod alembic revision --autogenerate -m "$(MSG)" 2>/dev/null || \
	docker compose exec backend alembic revision --autogenerate -m "$(MSG)"

## Seed the database with default strategies and demo watchlist symbols
seed:
	@echo "$(CYAN)$(BOLD)Seeding database...$(RESET)"
	docker compose exec backend-prod python scripts/seed.py 2>/dev/null || \
	docker compose exec backend python scripts/seed.py

## Open a psql shell into the PostgreSQL container
shell-db:
	@echo "$(CYAN)$(BOLD)Connecting to iTrade database...$(RESET)"
	docker compose exec postgres psql -U itrade -d itrade

# ─── Shells ───────────────────────────────────────────────────────────────────

## Open a bash shell inside the backend container
shell-backend:
	docker compose exec backend-prod bash 2>/dev/null || \
	docker compose exec backend bash

## Open a sh shell inside the frontend container
shell-frontend:
	docker compose exec frontend sh 2>/dev/null || \
	docker compose exec frontend-dev sh

# ─── Quality ──────────────────────────────────────────────────────────────────

## Run backend linting (ruff) inside the container
lint:
	@echo "$(CYAN)$(BOLD)Running linter...$(RESET)"
	docker compose exec backend-prod ruff check app/ 2>/dev/null || \
	docker compose exec backend ruff check app/

## Run backend tests with pytest
test:
	@echo "$(CYAN)$(BOLD)Running backend tests...$(RESET)"
	docker compose exec backend-prod pytest tests/ -v 2>/dev/null || \
	docker compose exec backend pytest tests/ -v

# ─── Utilities ────────────────────────────────────────────────────────────────

## Pull latest images from Docker Hub
pull:
	docker compose pull

## Show running containers and their status
ps:
	docker compose ps

## Remove dangling images and build cache
clean:
	@echo "$(BOLD)Cleaning Docker build cache and dangling images...$(RESET)"
	docker system prune -f

## Show this help message
help:
	@echo ""
	@echo "$(BOLD)iTrade — available make targets$(RESET)"
	@echo ""
	@grep -E '^## ' $(MAKEFILE_LIST) | while IFS= read -r line; do \
	  desc=$$(echo "$$line" | sed 's/## //'); \
	  target=$$(grep -n "^## $$desc" $(MAKEFILE_LIST) | head -1 | awk -F: '{print $$2}' | sed 's/## //'); \
	  next_line=$$(grep -A1 "^## $$desc" $(MAKEFILE_LIST) | tail -1 | sed 's/:.*//'); \
	  printf "  $(CYAN)%-20s$(RESET) %s\n" "$$next_line" "$$desc"; \
	done
	@echo ""

.DEFAULT_GOAL := help
