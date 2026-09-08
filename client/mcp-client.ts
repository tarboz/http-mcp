// @ts-nocheck
'use strict';

export default class Client {
    #connected = false;
    #requestId = 0;
    #serverUrl:string|undefined;
    #serverProtocolVersion;
    #serverInfo;
    #serverCapabilities;
    #tools = [];

    constructor() {
        const getConnected = () => !!this.#connected;

        return {
            connect: async (serverUrl:string|undefined) => {
                await this.#initConnection(serverUrl);

                if (this.#connected) {
                    await this.#notifyInitialized();

                    var tools = await this.#getToolsList();
                    this.#tools = Array.isArray(tools) ? tools : [];
                }
            },
            get connected() {
                return getConnected();
            },
            getToolsList: () => this.#tools,
            callTool: async (name, args) => this.callTool(name, args),
        }
    }

    async #initConnection(serverUrl:string|undefined) {
        this.#serverUrl = serverUrl;

        if (!this.#serverUrl) return false;

        var payload = this.getPayload('initialize');

        return fetch(this.#serverUrl, {
            method: 'POST',
            body: JSON.stringify(payload)
        })
        .then((fetchStatus) => {
            if (!fetchStatus.ok) throw new Error(`Server not responding. Code: ${fetchStatus.statusText}`);

            return fetchStatus.json();
        })
        .then((response) => {
            if (response.id !== this.#requestId) throw new Error('Invalid request ID');
            this.#connected = true;

            var { protocolVersion, capabilities, serverInfo } = response.result;
            this.#serverProtocolVersion = protocolVersion;
            this.#serverInfo = serverInfo;
            this.#serverCapabilities = capabilities;

            return true;
        })
        .catch((err) => {
            console.error(err);
            return false
        });
    }

    async #notifyInitialized() {
        var payload = this.getPayload('notifications/initialized');

        return fetch(this.#serverUrl, {
            method: 'POST',
            body: JSON.stringify(payload)
        })
        .then((fetchStatus) => {
            if (!fetchStatus.ok) throw new Error(`Server not responding. Code: ${fetchStatus.statusText}`);

            return true;
        })
        .catch((err) => {
            console.error(err);
            return false
        });
    }

    async #getToolsList() {
        var payload = this.getPayload('tools/list');

        return fetch(this.#serverUrl, {
            method: 'POST',
            body: JSON.stringify(payload)
        })
        .then((fetchStatus) => {
            if (!fetchStatus.ok) throw new Error(`Server not responding. Code: ${fetchStatus.statusText}`);

            return fetchStatus.json();
        })
        .then((response) => {
            if (response.id !== this.#requestId) throw new Error('Invalid request ID');

            return response.result.tools;
        })
        .catch((err) => {
            console.error(err);
            return false
        });
    }

    async callTool(name, toolCallArguments) {
        var payload = this.getPayload('tools/call');
        Object.assign(payload, {
            params: { name, arguments: toolCallArguments }
        });

        return fetch(this.#serverUrl, {
            method: 'POST',
            body: JSON.stringify(payload)
        })
        .then((fetchStatus) => {
            if (!fetchStatus.ok) throw new Error(`Server not responding. Code: ${fetchStatus.statusText}`);

            return fetchStatus.json();
        })
        .then((response) => {
            if (response.id !== this.#requestId) throw new Error('Invalid request ID');

            return response.result;
        })
        .catch((err) => {
            console.error(err);
            return undefined;
        });
    }

    getPayload(method) {
        return {
            jsonrpc: '2.0',
            id: ++this.#requestId,
            method: method,
        }
    }
}
