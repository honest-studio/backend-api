import { BaseProvider, StatusHubService, ConfigService, DfuseConfig } from '../../common';
import { Injectable } from '@nestjs/common';
import { ServiceName } from '../../shared';
import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import * as WebSocket from 'ws';
import { map, take, filter, bufferTime } from 'rxjs/operators';
import { BuildDfuseWebSocketEndpointUrl, BuildDfuseConnectionHeaders, logStandard } from '../../utils';
import { fromEvent, interval, NextObserver } from 'rxjs';
import { InboundMessage, ActionTraceData, TransactionTrace } from './contracts';

/**
 * Proxy class to allow injection of origin and API key headers,
 * and to deal with the crazy RxJS WebSocketCtor signature
 */
class WebSocketWithHeaderConfig extends WebSocket {
    static headerConfig: any = {};
    constructor(url: string, protocols?: string | string[]) {
        super(url, WebSocketWithHeaderConfig.headerConfig);
        return this;
    }
}

/**
 * EOS blockchain client
 */
@Injectable()
export class EosClientService extends BaseProvider {
    static dfuseConn: WebSocketSubject<any>;

    serviceName: ServiceName = ServiceName.EOS_CLIENT_SVC;
    /**
     * Dfuse.IO API config
     */
    dfuseConfig: DfuseConfig;

    /**
     * Observe OPEN event of WebSocket connection
     */
    private openObserver: NextObserver<Event> = {
        next: () => {
            console.log('WebSocket opened');
        },
        error: (val: any) => {
            console.warn('WebSocket open error: ', val);
        },
        complete: () => {
            console.log('WebSocket open observer complete');
        }
    };

    /**
     * Observe CLOSE event of WebSocket connection
     */
    private closeObserver: NextObserver<CloseEvent> = {
        next: () => {
            console.log('WebSocket close');
        },
        error: (val: any) => {
            console.warn('WebSocket close error: ', val);
        },
        complete: () => {
            console.log('WebSocket close observer complete');
        }
    };

    constructor(private config: ConfigService, protected statusHub: StatusHubService) {
        super(statusHub);
        this.dfuseConfig = config.get('dfuseConfig');
        WebSocketWithHeaderConfig.headerConfig = BuildDfuseConnectionHeaders(this.dfuseConfig);
        this.initWebSocketClient();
    }

    public SendSafe = (data: any) => {
        if (
            EosClientService.dfuseConn &&
            !EosClientService.dfuseConn.isStopped &&
            !EosClientService.dfuseConn.hasError
        ) {
            EosClientService.dfuseConn.next({
                type: 'get_actions',
                req_id: 'token_req',
                listen: true,
                data: {
                    account: 'everipediaiq'
                },
                // start_block: await get_start_block('everipediaiq')
                start_block: 9614902
            });
        }
    };

    public initWebSocketClient = () => {
        const targetUrl = BuildDfuseWebSocketEndpointUrl(this.dfuseConfig);
        const webSocketSubjConfig: WebSocketSubjectConfig<any> = {
            url: targetUrl,
            WebSocketCtor: WebSocketWithHeaderConfig as any,
            openObserver: this.openObserver,
            closeObserver: this.closeObserver
        };

        EosClientService.dfuseConn = new WebSocketSubject(webSocketSubjConfig);

        // pings only - pings should come from the server every 10 seconds
        EosClientService.dfuseConn
            .pipe(
                filter((msg: InboundMessage<any>) => {
                    return msg.type == 'ping';
                }),
                map((msg) => {
                    return msg.data as string;
                })
            )
            .subscribe(
                (msg) => console.log(`ping timestamp ${msg}`),
                (err) => console.error('socket err: ', err),
                () => console.warn('Completed!')
            );

        // action traces only
        EosClientService.dfuseConn
            .pipe(
                filter((msg: InboundMessage<any>) => {
                    return msg.type == 'action_trace';
                }),
                map((msg: InboundMessage<TransactionTrace & ActionTraceData<any>>) => {
                    return msg.data;
                }),
                bufferTime(500)
            )
            .subscribe(
                (msg) =>
                    msg && msg.length > 0
                        ? console.log(
                              'action trace data for blocks: ',
                              msg
                                  .map((x) => {
                                      return x.block_num;
                                  })
                                  .join(',')
                          )
                        : console.log('No blocks received'),
                (err) => console.error('socket err: ', err),
                () => console.warn('Completed!')
            );

        // no pings
        EosClientService.dfuseConn
            .pipe(
                filter((msg: InboundMessage<any>) => {
                    return msg.type !== 'ping' && msg.type !== 'action_trace';
                })
            )
            .subscribe(
                (msg) => console.log('socket data: ', msg),
                (err) => console.error('socket err: ', err),
                () => console.warn('Completed!')
            );

        setTimeout(() => {
            logStandard('Send get_actions -> fee req');
            this.SendSafe(null);
        }, 3000);
    };
}
