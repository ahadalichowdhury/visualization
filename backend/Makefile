.PHONY: help build run test clean migrate-up migrate-down

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

build: ## Build the application
	go build -o bin/server cmd/server/main.go

run: ## Run the application
	go run cmd/server/main.go

test: ## Run tests
	go test -v ./...

test-coverage: ## Run tests with coverage
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out

clean: ## Clean build artifacts
	rm -rf bin/
	rm -f coverage.out

deps: ## Download dependencies
	go mod download
	go mod tidy

migrate-up: ## Run database migrations up
	@echo "Running migrations up..."
	# Add your migration command here

migrate-down: ## Run database migrations down
	@echo "Running migrations down..."
	# Add your migration command here

dev: ## Run in development mode with hot reload
	@which air > /dev/null || go install github.com/cosmtrek/air@latest
	air

docker-build: ## Build Docker image
	docker build -t visualization-backend .

docker-run: ## Run Docker container
	docker run -p 9090:9090 --env-file .env visualization-backend
