import * as WebSocket from 'ws';
import { WebSocketAdapter, Injectable } from '@nestjs/common';
import { EnhancedServer, EnhancedSocket, WsClientByIp } from '../contracts';
import { IncomingMessage } from 'http';
import {
    ClientInitialConnect,
    ClientReconnected,
    KillClientConnectionById,
    logError,
    logStandard,
    logWarning
} from 'src/utils';
import { MessageMappingProperties } from '@nestjs/websockets';
import { Observable, fromEvent } from 'rxjs';
import { mergeMap, filter } from 'rxjs/operators';

/**
 * WebSocket server
 */
@Injectable()
export class WsHostAdapter implements WebSocketAdapter {
    static socket: EnhancedServer;
    static socketClients: WsClientByIp[] = [];
    static messages = [];
    static socketCount = 100;
    static featureSubscription: any;

    constructor() {}

    /**
     * Bind 'connectionRequest' handler to static server instance on client connect
     * @param server WebSocket server instance
     * @param callback callback to bind connectionRequest
     */
    bindClientConnect(server: WebSocket.Server, callback: (...args: any[]) => void) {
        server.on('connection', callback);
    }

    /**
     * Create websocket server instance
     * @param port Port number
     * @param options Socket create options
     */
    public create(port: number, options: WebSocket.ServerOptions) {
        WsHostAdapter.socket = new WebSocket.Server({ port }) as any;
        this.bindClientConnect(WsHostAdapter.socket, this.connectionRequest.bind(this));
    }

    private findClientSocket = (ipAddress: string) => {
        return WsHostAdapter.socketClients.find((item) => {
            return item.clientIp == ipAddress;
        });
    };

    /**
     * Handle WebSocket connection close
     */
    public close(server: any) {
        if (WsHostAdapter.socket) WsHostAdapter.socket.close();
    }

    /**
     * Hand client socket failure events
     */
    private handleClientSocketFailure = (clientSocketId: number) => {
        KillClientConnectionById(clientSocketId, WsHostAdapter.socketClients);
    };

    /**
     * Bind the provided message handler
     * @param buffer Buffer with event + data
     * @param handlers Handler mappings
     * @param process callback on message event
     */
    bindMessageHandler(
        buffer: { data: any },
        handlers: MessageMappingProperties[],
        process: (data: any) => Observable<any>
    ) {
        const message: { event: any; data: any } = JSON.parse(buffer.data);
        if (message && message.event) {
            const messageHandler = handlers.find((handler) => {
                return handler.message == message.event;
            });
            if (messageHandler) {
                return process(messageHandler.callback(message.data));
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    /**
     * Bind message handlers to client
     * @param client Socket instance
     * @param handlers Handlers to bind
     * @param process Callback
     */
    bindMessageHandlers(
        client: EnhancedSocket,
        handlers: MessageMappingProperties[],
        process: (data: any) => Observable<any>
    ) {
        fromEvent(client, 'message')
            .pipe(
                mergeMap((msg: { data: any }) => this.bindMessageHandler(msg, handlers, process)),
                filter((result) => !!result)
            )
            .subscribe((resp) => client.send(JSON.stringify(resp)));
    }

    /**
     * Send message to all connected clients
     * If the provided message is a string, it will be sent as-is.
     * If the provided message is any other type, it will be stringified as JSON first
     */
    private sendToAllClients = (message: any) => {
        try {
            const msg = typeof message == 'string' ? message : JSON.stringify(message);
            WsHostAdapter.socketClients.forEach((client) => {
                if (client.socketStatus) {
                    client.socketConn.send(msg);
                }
            });
        } catch (e) {
            logWarning(e, 'WS Host');
        }
    };

    /**
     * On connection init, assign a unique ID to the socket
     */
    public connectionRequest = (ws: EnhancedSocket, req: IncomingMessage) => {
        WsHostAdapter.socket.getUniqueID = () => {
            WsHostAdapter.socketCount++;
            return WsHostAdapter.socketCount;
        };

        ws.id = WsHostAdapter.socket.getUniqueID();
        const ipAddress = req.connection.remoteAddress.split(':').pop();
        const existingClient = this.findClientSocket(ipAddress);
        if (!existingClient) {
            WsHostAdapter.socketClients.push(ClientInitialConnect(ws, ws.id, ipAddress));
        } else {
            ClientReconnected(existingClient, ws, ws.id);
        }

        // ws.send an ack here if needed
        // bind ws.onmessage handler if needed
        /*
        ws.on('message', (evt: {data:any}) => {
            logStandard(evt.data, 'WS Host');
        });
        */

        ws.on('error', (e: any) => {
            logError(e, 'WS Host');
            this.handleClientSocketFailure(ws.id);
        });

        ws.on('close', (e: any) => {
            logStandard(e, 'WS Host');
            this.handleClientSocketFailure(ws.id);
        });
    };
}
