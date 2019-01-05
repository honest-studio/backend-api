import { Injectable } from '@nestjs/common';
import * as fetch from 'node-fetch';
import { IpfsService } from '../common';

@Injectable()
export class WikiService {
    private readonly ipfsService: IpfsService;

    constructor(ipfs: IpfsService) {
        this.ipfsService = ipfs;
    }

    async getWiki(ipfs_hash: string): Promise<any> {
        await this.ipfsService.client().pin.add(ipfs_hash);
        const buffer: Buffer = await this.ipfsService.client().cat(ipfs_hash);
        return buffer.toString('utf8');
    }
}
