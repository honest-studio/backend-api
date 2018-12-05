import {
    GetActionTracesMessageData,
    GetTransactionLifecycleMessageData,
    StreamOptions,
    OutboundMessage,
    GetTableRowsMessageData,
    OutboundMessageType,
    UnlistenMessageData
} from '../contracts';

export function getActionTracesMessage(
    data: GetActionTracesMessageData,
    streamOptions: StreamOptions = {}
): OutboundMessage<GetActionTracesMessageData> {
    return createOutboundMessage(OutboundMessageType.GET_ACTION_TRACES, data, { listen: true }, streamOptions);
}
export function getTableRowsMessage(
    data: GetTableRowsMessageData,
    streamOptions: StreamOptions = {}
): OutboundMessage<GetTableRowsMessageData> {
    return createOutboundMessage(OutboundMessageType.GET_TABLE_ROWS, data, { listen: true }, streamOptions);
}
export function getTransactionLifecycleMessage(
    data: GetTransactionLifecycleMessageData,
    streamOptions: StreamOptions = {}
): OutboundMessage<GetTransactionLifecycleMessageData> {
    return createOutboundMessage(
        OutboundMessageType.GET_TRANSACTION_LIFECYCLE,
        data,
        { listen: true, fetch: true },
        streamOptions
    );
}
export function unlistenMessage(data: UnlistenMessageData) {
    return {
        type: OutboundMessageType.UNLISTEN,
        data
    };
}

function createOutboundMessage<T>(
    type: OutboundMessageType,
    data: T,
    defaultStreamOptions: StreamOptions,
    streamOptions: StreamOptions
): OutboundMessage<T> {
    return {
        type,
        req_id: getStreamOption(defaultStreamOptions.req_id, streamOptions.req_id),
        listen: getStreamOption(defaultStreamOptions.listen, streamOptions.listen),
        fetch: getStreamOption(defaultStreamOptions.fetch, streamOptions.fetch),
        start_block: getStreamOption(defaultStreamOptions.start_block, streamOptions.start_block),
        with_progress: getStreamOption(defaultStreamOptions.with_progress, streamOptions.with_progress),
        data
    };
}

function getStreamOption<T>(defaultValue: T | undefined, actualValue: T | undefined): T | undefined {
    return actualValue === undefined ? defaultValue : actualValue;
}
