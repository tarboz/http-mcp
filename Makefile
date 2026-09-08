install:
	@if [ -f package-lock.json ]; then \
		echo "Installing dependencies from lock file..."; \
		npm ci --prefer-offline; \
	else \
		echo "Installing dependencies from scratch..."; \
		npm install; \
	fi

build:
	@echo "Building the project..."
	npm run build

start-mcp:
	@echo "Starting local MCP server..."
	npx mcp-server $(PORT) $(DEBUG)
# 	make start-mcp PORT=--port=8002 DEBUG=-d

start-mcp-sdk:
	@echo "Starting local MCP SDK server..."
	npx mcp-sdk-server $(PORT) $(DEBUG)
# 	make start-mcp-sdk PORT=--port=8002 DEBUG=-d

docker-start-mcp:
	@echo "Creating MCP server image..."
	docker build --build-arg PORT=8000 -t mcp-server . 
	@echo "Starting MCP server container..."
	@docker run --init mcp-server

docker-start-mcp-sdk:
	@echo "Creating MCP SDK server image..."
	docker build --build-arg PORT=8000 -t mcp-sdk-server . 
	@echo "Strting MCP SDK server container..."
	@docker run --init mcp-sdk-server

.PHONY: install build start-mcp start-mcp-sdk docker-start docker-start-mcp-sdk