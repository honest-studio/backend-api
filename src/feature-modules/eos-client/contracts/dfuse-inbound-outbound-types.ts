export interface InboundMessage<T> {
    type: InboundMessageType;
    req_id?: string;
    data: T;
}

// **Important** The key must be the same as the API type but in upper snake case for "in" operation to work
export enum InboundMessageType {
    ACTION_TRACE = 'action_trace',
    ERROR = 'error',
    LISTENING = 'listening',
    PING = 'ping',
    PROGRESS = 'progress',
    UNLISTENED = 'unlistened',
    TABLE_DELTA = 'table_delta',
    TABLE_SNAPSHOT = 'table_snapshot',
    TRANSACTION_LIFECYCLE = 'transaction_lifecycle'
}

export interface OutboundMessage<T> {
    type: OutboundMessageType;
    req_id?: string;
    listen?: boolean;
    fetch?: boolean;
    start_block?: number;
    with_progress?: number;
    data: T;
}

// **Important** The key must be the same as the API type but in upper snake case for "in" operation to work
export enum OutboundMessageType {
    GET_ACTION_TRACES = 'get_action_traces',
    GET_TABLE_ROWS = 'get_table_rows',
    GET_TRANSACTION_LIFECYCLE = 'get_transaction_lifecycle',
    UNLISTEN = 'unlisten'
}

export interface StreamOptions {
    listen?: boolean;
    req_id?: string;
    start_block?: number;
    fetch?: boolean;
    with_progress?: number;
}

export interface GetActionTracesMessageData {
    account?: string; // @deprecated, will be removed in next major bump
    accounts?: string;
    receiver?: string; // @deprecated, will be removed in next major bump
    receivers?: string;
    action_name?: string; // @deprecated, will be removed in next major bump
    action_names?: string;
    with_dbops?: boolean;
    with_dtrxops?: boolean;
    with_ramops?: boolean;
    with_inline_traces?: boolean;
}

export interface GetTableRowsMessageData {
    code: string;
    scope: string;
    table: string;
    json?: boolean;
    lower_bound?: string;
    upper_bound?: string;
}

export interface GetTransactionLifecycleMessageData {
    id: string;
}

export interface UnlistenMessageData {
    req_id: string;
}
