import { Injectable } from '@nestjs/common';
import * as mongo from '../mongo.connection';
import * as fetch from 'node-fetch';
import { IpfsService } from '../common';
import * as IpfsClient from 'ipfs-http-client';

@Injectable()
export class WikiService {
    private readonly ipfsClient: IpfsClient;

    constructor(ipfs: IpfsService) {
        this.ipfsClient=ipfs.getClient();
    }

    async getWiki(ipfs_hash: string): Promise<any> {
        await this.ipfsClient.pin.add(ipfs_hash);
        const buffer: Buffer = await this.ipfsClient.cat(ipfs_hash);
        return buffer.toString('utf8');
    }
}
