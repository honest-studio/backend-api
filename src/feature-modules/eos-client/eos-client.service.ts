import { BaseProvider, StatusHubService, ConfigService, DfuseConfig } from '../../common';
import { Injectable } from '@nestjs/common';
import { ServiceName } from '../../shared';
import { fromEvent, interval } from 'rxjs';

/**
 * EOS blockchain client
 */
@Injectable()
export class EosClientService extends BaseProvider {
    serviceName: ServiceName = ServiceName.EOS_CLIENT_SVC;
    /**
     * Dfuse.IO API config
     */
    dfuseConfig: DfuseConfig;

    constructor(private config: ConfigService, protected statusHub: StatusHubService) {
        super(statusHub);
        this.dfuseConfig = config.get('dfuseConfig');
    }

    public initWebSocketClient = () => {
        // socket$.se
    };
}
