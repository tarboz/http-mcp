# MCP Projects

A collection of Model Context Protocol (MCP) implementations including server, client, and SDK server components.

## Project Structure

```
.
├── common/              # Shared utilities
├── server/              # Standard MCP server implementation
├── server-sdk/          # MCP SDK server with weather tools
├── client/              # MCP client implementation
├── package.json         # Root package configuration
├── Dockerfile           # Docker configuration
├── Makefile             # Build and run scripts
└── README.md            # This file
```

## Components

### 1. Common Utilities (`common/`)

Shared utility functions used across the project.

### 2. Standard MCP Server (`server/`)

A basic MCP server implementation that:
- Provides internet search functionality via Tavily API
- Supports the standard MCP protocol
- Accepts tool calls and returns results

### 3. MCP SDK Server (`server-sdk/`)

An MCP server using the Model Context Protocol SDK with weather tools:
- `get_alerts`: Get weather alerts for a US state
- `get_forecast`: Get weather forecast for coordinates

### 4. MCP Client (`client/`)

A client implementation that can:
- Connect to MCP servers
- List available tools
- Call tools with arguments
- Handle responses

## Features

- **Multi-protocol support**: Both standard MCP and SDK implementations
- **Docker support**: Containerized deployment
- **Tool registration**: Dynamic tool registration with validation
- **Cross-origin support**: CORS headers for web integration
- **Debug mode**: Verbose logging for development

## Installation

```bash
# Install dependencies
make install

# Build the project
make build
```

## Running

### Local Server

```bash
# Start standard MCP server
make start-mcp

# Start SDK server
make start-mcp-sdk

# With custom port and debug
make start-mcp PORT=--port=8002 DEBUG=-d
```

### Docker

```bash
# Build and run standard server container
make docker-start-mcp

# Build and run SDK server container
make docker-start-mcp-sdk
```

## Usage Examples

### Client Usage

```javascript
import MCPClient from './mcp-client.js';

const SERVER_URL = 'http://localhost:8000/mcp';
const mcpClient = new MCPClient();

await mcpClient.connect(SERVER_URL);

console.log('Connected tools:', mcpClient.getToolsList());
console.log('Connected:', mcpClient.connected);

// Call a tool
const response = await mcpClient.callTool(
    'make_search', 
    { query: 'sum41' }
);
```

### Server Tools

#### Standard Server
- `make_search`: Internet search using Tavily API

#### SDK Server
- `get_alerts`: Get weather alerts for a state
- `get_forecast`: Get weather forecast for coordinates

## Development

### Building

```bash
npm run build
```

## Configuration

Environment variables:
- `PORT`: Server port (default: 8000)
- `DEBUG`: Enable debug logging (default: false)

## Docker

A multi-stage Docker build is provided that:
- Builds the TypeScript code
- Copies dependencies
- Runs with proper user permissions
- Exposes the configured port

## License

ISC License

## Author

Taras Bozhok