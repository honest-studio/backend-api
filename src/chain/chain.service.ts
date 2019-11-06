import { Injectable } from '@nestjs/common';
import * as fetch from 'node-fetch';
import { ConfigService } from '../common';
import { Api, JsonRpc, RpcError } from 'eosjs';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
import ecc from 'eosjs-ecc';


@Injectable()
export class ChainService {
    constructor(private config: ConfigService) {}

    async forward(eos_api_endpoint, body): Promise<any> {
        const dfuseRestEndpoint = this.config.get("DFUSE_API_REST_ENDPOINT");
        return fetch(`${dfuseRestEndpoint}/v1/chain/${eos_api_endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer: ${this.config.get("DFUSE_API_KEY")}`
            },
            body: JSON.stringify(body)
        }).then((r) => r.json());
    }

    async obtainDfuseToken() {
        const DFUSE_AUTH_URL = 'https://auth.dfuse.io/v1/auth/issue';
        return await fetch(DFUSE_AUTH_URL, {
            method: 'POST',
            body: JSON.stringify({ api_key: this.config.get("DFUSE_API_KEY") })
        }).then((response) => response.json());
    }

    // Sign the transaction with the evrpdcronjob account then broadcast it
    // Everipedia will pay for CPU that goes through here, so it is limited to 
    // Everipedia actions only
    async pushTransaction(transaction): Promise<any> {
        return fetch(`http://api.libertyblock.io/v1/chain/push_transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                //Authorization: `Bearer: ${dfuseToken.token}`,
                //'X-Eos-Push-Guarantee': 'in-block'
            },
            body: JSON.stringify(transaction)
        }).then((r) => r.json());
    }

    async getTableRows(body): Promise<any> {
        console.log(body);
        return fetch(`${this.config.get("DFUSE_API_REST_ENDPOINT")}/v1/chain/get_table_rows`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer: ${this.config.get("DFUSE_API_KEY")}`,
                'X-Eos-Push-Guarantee': 'in-block'
            },
            body: JSON.stringify(body)
        }).then((r) => r.json());
    }

    async msig(proposer, proposal_name) {
        const privkey = this.config.get("PAY_CPU_PRIVKEY");
        const signatureProvider = new JsSignatureProvider([privkey]);
        const rpc = new JsonRpc('http://api.libertyblock.io', { fetch });
        const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

        const result = await api.transact({
            actions: [{
                account: 'eosio.msig',
                name: 'approve',
                authorization: [{
                    actor: 'evrpdcronjob',
                    permission: 'active',
                }],
                data: {
                    proposer,
                    proposal_name,
                    level: {
                        actor: "evrpdcronjob", 
                        permission: "active"
                    }
                }
            },{
                account: 'eosio.msig',
                name: 'exec',
                authorization: [{
                    actor: 'evrpdcronjob',
                    permission: 'active',
                }],
                data: {
                    proposer,
                    proposal_name,
                    executer: "evrpdcronjob"
                }
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30
        });

        return result;
    }
}
