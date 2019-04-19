import { Injectable } from '@nestjs/common';
import * as IpfsClient from 'ipfs-http-client';
import { ConfigService } from './config-service';

/**
 * Call in a service like:
 * constructor(ipfs: IpfsService) {
 *       this.ipfsClient=ipfs.getClient();
 *  }
 */
@Injectable()
export class IpfsService {
    private readonly ipfsClient: IpfsClient;

    constructor(private config: ConfigService) {
        this.ipfsClient = new IpfsClient({
            host: this.config.get('IPFS_DAEMON_HOST'),
            port: this.config.get('IPFS_DAEMON_PORT')
        });
    }

    /**
     * get an instance of IpfsClient
     */
    client(): IpfsClient {
        return this.ipfsClient;
    }
}
