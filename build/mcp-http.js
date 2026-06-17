import { McpServer } from '@modelcontextprotocol/server';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import { z } from 'zod';
import { styleText } from 'node:util';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
const NWS_API_BASE = 'https://api.weather.gov';
const USER_AGENT = 'weather-app/1.0.0';
const PORT = 8090;
var server = new McpServer({
    name: 'weather',
    version: '1.0.0',
});
async function makeNWSRequest(url) {
    var headers = {
        'User-Agent': USER_AGENT,
        'Accept': 'application/geo+json'
    };
    return fetch(url, { headers })
        .then((response) => {
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    })
        .catch((err) => {
        console.error("Error making NWS request:", err);
        return null;
    });
}
function formatAlert(feature) {
    var { properties: props } = feature;
    return [
        `Event: ${props.event || "Unknown"}`,
        `Area: ${props.areaDesc || "Unknown"}`,
        `Severity: ${props.severity || "Unknown"}`,
        `Status: ${props.status || "Unknown"}`,
        `Headline: ${props.headline || "No headline"}`,
        "---",
    ].join("\n");
}
server.registerTool('get_alerts', {
    description: "Get weather alerts for a state",
    inputSchema: z.object({
        state: z
            .string()
            .length(2)
            .describe('Two-letter state code (e.g. CA, NY)')
    })
}, async ({ state }) => {
    const stateCode = state.toUpperCase();
    const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
    var alertsData = await makeNWSRequest(alertsUrl);
    if (!alertsData) {
        return formatToolResponse('Failed to retrieve alerts data');
    }
    var { features } = alertsData;
    if (!features || features.length === 0) {
        return formatToolResponse(`No active alerts for ${stateCode}`);
    }
    var formattedAlerts = features.map(formatAlert);
    var alertsText = `Active alerts for ${stateCode}:\n\n${formattedAlerts.join('\n')}`;
    return formatToolResponse(alertsText);
});
server.registerTool('get_forecast', {
    description: 'Get weather forecast for a location',
    inputSchema: z.object({
        latitude: z
            .number()
            .min(-90)
            .max(90)
            .describe('Latitude of the location'),
        longitude: z
            .number()
            .min(-180)
            .max(180)
            .describe('Longitude of the location'),
    })
}, async ({ latitude, longitude }) => {
    var pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    var pointsData = await makeNWSRequest(pointsUrl);
    if (!pointsData) {
        return formatToolResponse(`Failed to retrieve grid point data for coordinates: ${latitude}, ${longitude}. This location may not be supported by the NWS API (only US locations are supported).`);
    }
    var forecastUrl = pointsData.properties.forecast;
    if (!forecastUrl) {
        return formatToolResponse('Failed to get forecast URL from grid point data');
    }
    var forecastData = await makeNWSRequest(forecastUrl);
    if (!forecastData) {
        return formatToolResponse('Failed to retrieve forecast data');
    }
    var periods = forecastData.properties.periods || [];
    if (periods.length === 0) {
        return formatToolResponse('No forecast periods available');
    }
    var formattedForecast = periods.map((period) => [
        `${period.name || 'Unknown'}:`,
        `Temperature: ${period.temperature || 'Unknown'}°${period.temperatureUnit || 'F'}`,
        `Wind: ${period.windSpeed || 'Unknown'} ${period.windDirection || ''}`,
        `${period.shortForecast || 'No forecast available'}`,
        '---',
    ].join('\n'));
    var forecastText = `Forecast for ${latitude}, ${longitude}:\n\n${formattedForecast.join('\n')}`;
    return formatToolResponse(forecastText);
});
function formatToolResponse(text) {
    return {
        content: [
            {
                type: 'text',
                text,
            },
        ],
    };
}
async function main() {
    var transport = new NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    var app = new Hono();
    app.all('/mcp', async (c) => {
        // @ts-ignore
        return transport.handleRequest(c.req.raw, c.res.raw);
    });
    serve({
        fetch: app.fetch,
        port: 8787,
    });
}
main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
});
function logger(msg) {
    Promise.resolve().then(() => {
        var message = msg instanceof Error ? msg.message : msg;
        if (typeof message === 'object')
            message = JSON.stringify(message);
        console.log(styleText(['green', 'bold'], 'DEBUG'));
        console.log(styleText('green', String(message)));
    });
}
//# sourceMappingURL=mcp-http.js.map