import { Injectable } from '@nestjs/common';
import * as IpfsClient from 'ipfs-http-client';
import { IpfsConfig } from './config-types';
import { ConfigService } from './config-service';

/**
 * Construct and build app config to be shared across modules
 * Call in a service like:
 * constructor(ipfs: IpfsService) {
 *       this.ipfsClient=ipfs.getClient();
 *  }
 */
@Injectable()
export class IpfsService {
    private readonly ipfsClient: IpfsClient;
    private readonly ipfsConfig: IpfsConfig;

    constructor(config: ConfigService) {
        this.ipfsConfig = config.get('ipfsConfig');
        this.ipfsClient = new IpfsClient({
            host: this.ipfsConfig.ipfsDaemonHost,
            port: this.ipfsConfig.ipfsDaemonPort
        });
    }

    /**
     * get an instance of IpfsClient 
     */
    getClient(): Promise<IpfsClient> {
        return this.ipfsClient;
    }
}
