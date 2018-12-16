import { Injectable } from '@nestjs/common';
import * as IpfsClient from 'ipfs-http-client';

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

    constructor() {
        this.ipfsClient = new IpfsClient({
            host: 'localhost',
            port: 5001
        });
    }

    /**
     * get an instance of IpfsClient 
     */
    getClient(): Promise<IpfsClient> {
        return this.ipfsClient;
    }
}
