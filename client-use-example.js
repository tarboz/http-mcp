'use strict';

import MCPClient from './mcp-client.js';

const SERVER_URL = 'http://localhost:8000/mcp';

var mcpClient = new MCPClient;

await mcpClient.connect(SERVER_URL);

console.log('after connect');
console.dir(mcpClient);

console.log('getToolsList', mcpClient.getToolsList());
console.log('connected', mcpClient.connected);

var resp = await mcpClient.callTool(
    'make_search', 
    { query: 'sum41' }
);
console.log('resp');
console.dir(resp);