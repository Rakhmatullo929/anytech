.PHONY: help build up down restart logs shell migrate makemigrations createsuperuser \
       prod-build prod-up prod-down

# ---------------------------------------------------------------------------
# Development
# ---------------------------------------------------------------------------

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build dev containers
	docker compose build

up: ## Start dev stack (detached)
	docker compose up -d

up-logs: ## Start dev stack (foreground with logs)
	docker compose up

down: ## Stop dev stack
	docker compose down

restart: ## Restart dev stack
	docker compose restart

logs: ## Tail logs for all services
	docker compose logs -f

logs-web: ## Tail logs for web service
	docker compose logs -f web

shell: ## Open Django shell in web container
	docker compose exec web python manage.py shell

dbshell: ## Open database shell
	docker compose exec db psql -U anytech -d anytech_erp

migrate: ## Run Django migrations
	docker compose exec web python manage.py migrate

makemigrations: ## Create Django migrations
	docker compose exec web python manage.py makemigrations

createsuperuser: ## Create Django superuser
	docker compose exec web python manage.py createsuperuser

collectstatic: ## Collect static files
	docker compose exec web python manage.py collectstatic --noinput

test: ## Run tests
	docker compose exec web pytest

flush: ## Reset database
	docker compose exec web python manage.py flush --noinput

# ---------------------------------------------------------------------------
# Production
# ---------------------------------------------------------------------------

prod-build: ## Build production containers
	docker compose -f docker-compose.prod.yml build

prod-up: ## Start production stack
	docker compose -f docker-compose.prod.yml up -d

prod-down: ## Stop production stack
	docker compose -f docker-compose.prod.yml down

prod-logs: ## Tail production logs
	docker compose -f docker-compose.prod.yml logs -f

# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------

clean: ## Remove all containers, volumes, and images
	docker compose down -v --rmi local
	docker compose -f docker-compose.prod.yml down -v --rmi local 2>/dev/null || true
