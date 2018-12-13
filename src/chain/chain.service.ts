import { Injectable } from '@nestjs/common';
import * as fetch from 'node-fetch';
import { ConfigService, DfuseConfig } from '../common';

@Injectable()
export class ChainService {
    private readonly dfuseConfig: DfuseConfig;

    constructor(config: ConfigService) {
        this.dfuseConfig = config.get('dfuseConfig');
    }

    async forward(eos_api_endpoint, body): Promise<any> {
        return fetch(`${this.dfuseConfig.dfuseRestEndpoint}/v1/chain/${eos_api_endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer: ${this.dfuseConfig.dfuseApiKey}`
            },
            body: JSON.stringify(body)
        }).then((r) => r.json());
    }

    async pushTransaction(transaction): Promise<any> {
        return fetch(`${this.dfuseConfig.dfuseRestEndpoint}/v1/chain/push_transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer: ${this.dfuseConfig.dfuseApiKey}`,
                'X-Eos-Push-Guarantee': 'in-block'
            },
            body: JSON.stringify(transaction)
        }).then((r) => r.json());
    }
}
