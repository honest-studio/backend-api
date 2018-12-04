import { BaseProvider, StatusHubService, ConfigService, DfuseConfig } from '../../common';
import { Injectable } from '@nestjs/common';
import { ServiceName } from '../../shared';
import * as WebSocket from 'ws';
import { BuildDfuseWebSocketEndpointUrl, BuildDfuseConnectionHeaders } from '../../utils';
import { fromEvent, interval } from 'rxjs';

/**
 * EOS blockchain client
 */
@Injectable()
export class EosClientService extends BaseProvider {
    static dfuseConn: WebSocket;

    serviceName: ServiceName = ServiceName.EOS_CLIENT_SVC;
    /**
     * Dfuse.IO API config
     */
    dfuseConfig: DfuseConfig;

    constructor(private config: ConfigService, protected statusHub: StatusHubService) {
        super(statusHub);
        this.dfuseConfig = config.get('dfuseConfig');
        // this.initWebSocketClient();
    }

    public initWebSocketClient = () => {
        EosClientService.dfuseConn = new WebSocket(
            BuildDfuseWebSocketEndpointUrl(this.dfuseConfig),
            BuildDfuseConnectionHeaders(this.dfuseConfig)
        );

        EosClientService.dfuseConn.on('open', async () => {
            console.log(' ----- OPENED WEBSOCKET -----');
        });
    };
}
