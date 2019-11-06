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
    async sign(transaction): Promise<any> {
        const privkey = this.config.get("PAY_CPU_PRIVKEY");
        const pubkey = this.config.get("PAY_CPU_PUBKEY");
        const signer = new JsSignatureProvider([privkey]);
        const signBuf = Buffer.concat([
            Buffer.from(transaction.chain_id, 'hex'), Buffer.from(transaction.serialized_transaction), new Buffer(new Uint8Array(32)),
        ]);
        const sig = ecc.Signature.sign(signBuf, privkey).toString();

        return sig;
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
}
