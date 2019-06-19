import { EnhancedSocket, WsClientByIp } from '../../shared';

/**
 * If a client is newly-connected, create the mapping to their IP address
 * and bind to a socket instance
 * @param socketConnection EnhancedSocket instance to bind to client
 * @param wsId ID of new WebSocket connection
 * @param clientIp IP address of client
 * @param features optional array of features for client (default: [])
 */
export const ClientInitialConnect = (
    socketConnection: EnhancedSocket,
    wsId: number,
    clientIp: string,
    features: any[] = []
): WsClientByIp => {
    return {
        socketConn: socketConnection,
        id: wsId,
        clientIp: clientIp,
        sessionStartTime: Date.now(),
        socketStatus: true,
        features: features
    };
};

/**
 * If a client has reconnected, update their session start time and socket ID
 * @param client Client instance
 * @param socketConnection EnhancedSocket instance to bind to client
 * @param wsId ID of new WebSocket connection
 */
export const ClientReconnected = (
    client: WsClientByIp,
    socketConnection: EnhancedSocket,
    wsId: number
): WsClientByIp => {
    client.socketConn = socketConnection;
    client.id = wsId;
    client.sessionStartTime = Date.now();
    client.socketStatus = true;
    return client;
};

/**
 * Try to find the index of a client in a provided array by their socket ID. If not found, return -1.
 * @param clientWsId Client websocket ID to query on
 * @param clients Array of clients
 */
export const TryGetClientIndexById = (clientWsId: number, clients: WsClientByIp[] = []): number => {
    return clients.findIndex((x) => {
        return x.id == clientWsId;
    });
};

/**
 * Look up clients by websocket ID. If found, set the client's socketStatus flag to false
 * Return true if found + updated, else false
 * @param clientWsId Client websocket ID to query on
 * @param clients Array of clients
 */
export const KillClientConnectionById = (clientWsId: number, clients: WsClientByIp[]): boolean => {
    let idx = TryGetClientIndexById(clientWsId, clients);
    if (idx == -1) {
        return false;
    } else {
        clients[idx].socketStatus = false;
        return true;
    }
};
