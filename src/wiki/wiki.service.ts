import { Injectable } from '@nestjs/common';
import * as mongo from '../mongo.connection';
import * as fetch from 'node-fetch';
import * as ipfsClient from 'ipfs-http-client';

@Injectable()
export class WikiService {
    async getWiki(ipfs_hash: string): Promise<any> {
        const ipfs = new ipfsClient();
        await ipfs.pin.add(ipfs_hash);
        const buffer: Buffer = await ipfs.cat(ipfs_hash);
        return buffer.toString('utf8');
    }
}
