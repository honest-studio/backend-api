//import { Injectable } from '@nestjs/common';
//import * as fetch from 'node-fetch';
//import { ConfigService } from '../common';
//import { MongoDbService } from '../feature-modules/database';
//
//@Injectable()
//export class ChainService {
//    constructor(private config: ConfigService, private mongo: MongoDbService) {}
//
//    async getEpActions(contract: string, since: number) {
//        const actions = await this.mongo.connection().actions.find({
//            'trace.act.account': contract,
//            'block_num': { $gt: since }
//        })
//        .toArray()
//        actions.forEach(a => delete a._id);
//        return actions;
//    }
//
//    async forward(eos_api_endpoint, body): Promise<any> {
//        const dfuseRestEndpoint = this.config.get("DFUSE_API_REST_ENDPOINT");
//        return fetch(`${dfuseRestEndpoint}/v1/chain/${eos_api_endpoint}`, {
//            method: 'POST',
//            headers: {
//                'Content-Type': 'application/json',
//                Authorization: `Bearer: ${this.config.get("DFUSE_API_KEY")}`
//            },
//            body: JSON.stringify(body)
//        }).then((r) => r.json());
//    }
//
//    async pushTransaction(transaction): Promise<any> {
//        return fetch(`${this.config.get("DFUSE_API_REST_ENDPOINT")}/v1/chain/push_transaction`, {
//            method: 'POST',
//            headers: {
//                'Content-Type': 'application/json',
//                Authorization: `Bearer: ${this.config.get("DFUSE_API_KEY")}`,
//                'X-Eos-Push-Guarantee': 'in-block'
//            },
//            body: JSON.stringify(transaction)
//        }).then((r) => r.json());
//    }
//}
