import { Injectable, BadRequestException } from '@nestjs/common';
import * as fetch from 'node-fetch';
import { ConfigService } from '../common';
const { Api, JsonRpc, RpcError } = require('eosjs');
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
        const signatureProvider = new JsSignatureProvider([privkey]);
        const rpc = new JsonRpc('http://127.0.0.1:8888', { fetch });
        const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

        // Make sure actions are only directed at Everipedia contracts
        const WHITELISTED_CONTRACTS = ["everipediaiq", "eparticlectr", "epsovreignid", "prediqtpedia", "prediqtmarke", "eosio.token"];
        const transaction_buffer = Buffer.from(transaction.serializedTransaction.data);
        const tx = api.deserializeTransaction(transaction_buffer);
        for (let action of tx.actions) {
            if (!WHITELISTED_CONTRACTS.includes(action.account)) {
                const message = `FREELOADER ALERT: CPU payments not supported for ${action.account}`;
                console.warn("============= FREELOADER ALERT ===========");
                console.warn(message);
                console.warn("============= FREELOADER ALERT ===========");
                throw new BadRequestException(message);
            }

            // 70e89bf4a254ef56 is the hex eos name encoding for evrpdcronjob
            if (action.data.toLowerCase().includes("70e89bf4a254ef56")) {
                const message = `HACKER ALERT: evrpdcronjob cannot be involved in the action.`;
                console.warn("============= HACKER ALERT ===========");
                console.warn(message);
                console.warn("============= HACKER ALERT ===========");
                throw new BadRequestException(message);
            }

            // Only EOS transfers to prediqtpedia and prediqtmarke are supported
            if (action.account == "eosio.token" && action.data.toLowerCase().slice(16,32) != "605c52355b97d4ad") {
                const message = `FREELOADER ALERT: EOS transfers only supported to prediqtpedia`;
                console.warn("============= FREELOADER ALERT ===========");
                console.warn(message);
                console.warn("============= FREELOADER ALERT ===========");
                throw new BadRequestException(message);
            }
        }
        const signBuf = Buffer.concat([
            Buffer.from(transaction.chainId, 'hex'), transaction_buffer, Buffer.from(new Uint8Array(32)),
        ]);
        const sig = ecc.Signature.sign(signBuf, privkey).toString();

        return { signatures: [sig], serializedTransaction: transaction_buffer.toString('hex') }
    }

    async getTableRows(body): Promise<any> {
        // console.log(body);
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
