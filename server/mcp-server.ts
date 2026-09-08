#!/usr/bin/env node

import { createServer, IncomingMessage } from 'node:http';
import { parseArgs } from 'node:util';
import { Buffer } from 'node:buffer';
import { printTextWithHeading } from 'common/utils';

var { port: portArg, debug: debugMode } = parseArgs({
    args: process.argv.slice(2),
    options: {
        port: { type: 'string', short: 'p' },
        debug: { type: 'boolean', short: 'd' },
    }
}).values;

portArg = portArg || process.env.PORT || '8000';
debugMode = debugMode || process.env.DEBUG?.toLowerCase() === 'true';

const PORT = +portArg;
const PROTOCOL_VERSION = '2025-03-26';

var debug = debugMode ? printTextWithHeading : () => {};
debug('Running in DEBUG mode');

var server = createServer(async (req, res) => {
    debug(req.method, req.url);

    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.writeHead(204);
        return res.end();
    }

    if (req.url === '/mcp') {
        var payload = JSON.parse(await parseRequest(req));
        debug('payload', payload);

        var { method } = payload;

        if (method === 'notifications/initialized') {
            res.writeHead(204);
            res.end();
        }

        if (method === 'initialize') {
            let response = {
                jsonrpc: '2.0',
                id: payload.id,
                result: {
                    protocolVersion: PROTOCOL_VERSION,
                    capabilities: {
                        tools: {
                            'listChanged': true
                        }
                    },
                    serverInfo: {
                        name: 'custom-server',
                        version: '0.1.0'
                    }
                },
            };
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
            debug('response', response);
        }

        if (method === 'tools/list') {
            let response = {
                jsonrpc: '2.0',
                id: payload.id,
                result: {
                    tools: Object.values(TOOLS).map((tool) => ({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema})),
                }
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
            debug('response', response);
        }

        if (method === 'tools/call') {
            var { params } = payload;
            var tool = getTool(params.name);

            if (!tool) {
                console.error(`No tool ${params.name} found`);
                res.writeHead(404);
                res.end();
                return undefined;
            }

            var result = await tool.call(params.arguments);

            let response = {
                jsonrpc: '2.0',
                id: payload.id,
                result
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
            debug('response', response);
        }

        return null;
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Call /mcp endpoint');
});

server.on('data chunk DELETE', (chunk) => {
    console.log(chunk);
});

server.listen(PORT, () => {
   printTextWithHeading(`Listening ${PORT}`);
});

async function parseRequest(req:IncomingMessage) {
    var { url, method } = req;
    var [, query] = url?.split('?') || [];

    if (method === 'POST') {
        var bufferChunks = [];
        for await (var chunk of req) bufferChunks.push(chunk);
        return Buffer.concat(bufferChunks).toString('utf8');
    } else {
        var data = query ? query.split('&').reduce(
            (acc, el) => {
                let [pname, pvalue] = el.split('=');
                return (acc[pname] = pvalue, acc);
            }, {} as Record<string, any>) : {};
        return JSON.stringify(data);
    }
}

function getTool(name:string) {
    return Object.values(TOOLS).find((tool) => tool.name === name);
}

const TOOLS = {
    internetSearch: 
        {
            name: 'make_search',
            description: 'Makes internet search.  Call it when asked to search internet for some topic.',
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'The query to search for'
                    }
                },
                required: ['query']
            },
            call: async ({ query } = { query: ''}) => {
                var headers = {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer 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'
                };
                var payload = {
                    query,
                    'search_depth': 'advanced'
                };
                return fetch('https://api.tavily.com/search', { headers, method: 'POST', body: JSON.stringify(payload) })
                        .then((response) => {
                            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                            return response.json() as Record<any, any>;
                        })
                        .then((response) => {
                            var content = response.results?.map((result:Record<any, any>) => ({ type: 'text', text: result.content }));
                            return { content };
                        })
                        .catch((err) => {
                            console.error('Error making search request:', err);
                            return {};
                        });
            }
        },
}
