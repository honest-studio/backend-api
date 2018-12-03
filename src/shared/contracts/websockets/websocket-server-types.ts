import * as WebSocket from 'ws';

/**
 * WebSocket server with ability to track connections by ID
 */
export type EnhancedServer = { getUniqueID: () => number } & WebSocket.Server;

/**
 * WebSocket with unique IDs
 */
export type EnhancedSocket = WebSocket & { id: number };

/**
 * Websocket client by IP address
 */
export type WsClientByIp = {
    /**
     * Socket ID number specific to client
     */
    id: number;
    /**
     * Client IP address
     */
    clientIp: string;
    /**
     * Whether the connection was granted successfully
     */
    socketStatus: boolean;
    /**
     * Socket connection instance
     */
    socketConn: EnhancedSocket;
    /**
     * Client features
     */
    features: any[];
    /**
     * Session start time (in UTC)
     */
    sessionStartTime: number;
};

/**
 * Standard WebSocket ready codes
 */
export enum WebSocketReadyState {
    CONNECTING = 0,
    OPEN = 1,
    CLOSING = 2,
    CLOSED = 3
}
