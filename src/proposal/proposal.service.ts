import { Injectable, NotFoundException } from '@nestjs/common';
import { MongoDbService } from '../feature-modules';
import * as fetch from 'node-fetch';
import { ConfigService, CopyLeaksConfig, IpfsService } from '../common';
import { EosAction, Propose, Vote, ProposalResult } from '../feature-modules/database/mongodb-schema';
import { WikiService } from '../wiki/wiki.service';
import HtmlDiff from 'htmldiff-js';


@Injectable()
export class ProposalService {
    private readonly copyLeaksConfig: CopyLeaksConfig;

    constructor(config: ConfigService, private ipfs: IpfsService, private mongo: MongoDbService, private wikiService: WikiService) {
        this.copyLeaksConfig = config.get('copyLeaksConfig');
    }
    async getProposal(proposal_hash: string): Promise<EosAction<Propose>> {
        const proposal = await this.mongo.connection().actions.findOne({
            'data.trace.act.account': 'eparticlectr',
            'data.trace.act.name': 'propose',
            'data.trace.act.data.proposed_article_hash': proposal_hash
        });
        if (!proposal) throw new NotFoundException('Proposal not found');
        else return proposal;
    }
    async getVotes(proposal_hash: string): Promise<Array<EosAction<Vote>>> {
        return this.mongo
            .connection()
            .actions.find({
                'data.trace.act.account': 'eparticlectr',
                'data.trace.act.name': 'votebyhash',
                'data.trace.act.data.proposal_hash': proposal_hash
            })
            .toArray();
    }
    async getResult(proposal_hash: string): Promise<ProposalResult> {
        const result = await this.mongo.connection().actions.findOne({
            'data.trace.act.account': 'eparticlectr',
            'data.trace.act.name': 'logpropres',
            'data.trace.act.data.proposal': proposal_hash
        });

        if (result) return result.data.trace.act.data;

        const proposal = await this.getProposal(proposal_hash);
        if (proposal.error) throw new NotFoundException('Proposal not found');

        const votes = await this.getVotes(proposal_hash);

        const ret = {
            proposal: proposal_hash,
            approved: 0,
            yes_votes: 50,
            no_votes: 0
        };

        votes.forEach(function(vote) {
            if (vote.data.trace.act.data.approve) ret.yes_votes += vote.data.trace.act.data.amount;
            else ret.no_votes += vote.data.trace.act.data.amount;
        });
        if (ret.yes_votes > ret.no_votes) ret.approved = 1;

        const starttime = new Date(proposal.data.trace.block_time).getTime();
        const now = new Date().getTime();
        const SIX_HOURS = 6 * 3600 * 1000; // in milliseconds
        if (now < starttime + SIX_HOURS) ret.approved = -1;

        return ret;
    }

    async getPlagiarism(proposal_hash: string): Promise<any> {
        const result = await this.mongo.connection().plagiarism.findOne({
            proposal_hash: proposal_hash
        });
        if (result) return result;

        const proposal = await this.getProposal(proposal_hash);
        if (proposal.error) return { error: 'Proposal not found' };

        const tokenReqBody = JSON.stringify({
            Email: this.copyLeaksConfig.copyLeaksApiEmail,
            ApiKey: this.copyLeaksConfig.copyLeaksApiKey
        });
        const token_json = await fetch('https://api.copyleaks.com/v1/account/login-api', {
            method: 'post',
            body: tokenReqBody,
            headers: { 'Content-Type': 'application/json' }
        }).then((res) => res.json());
        const access_token = token_json.access_token;

        const createReqBody = await this.wikiService.getWiki(proposal_hash);
        const create_json = await fetch('https://api.copyleaks.com/v1/businesses/create-by-text', {
            method: 'post',
            body: createReqBody,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${access_token}`
            }
        }).then((res) => res.json());
        const processId = create_json.ProcessId;

        // Check the status every 5s until the process completes
        await new Promise(function(resolve, reject) {
            const timer = setInterval(async function() {
                const status_json = await fetch(`https://api.copyleaks.com/v1/businesses/${processId}/status`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${access_token}`
                    }
                }).then((res) => res.json());
                if (status_json.Status == 'Finished') {
                    resolve();
                    clearInterval(timer);
                }
            }, 5000);
        });

        const result_json = await fetch(`https://api.copyleaks.com/v2/businesses/${processId}/result`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${access_token}`
            }
        }).then((res) => res.json());

        const doc = {
            proposal_hash: proposal_hash,
            copyleaks: result_json
        };
        await new Promise(function(resolve, reject) {
            this.mongo.connection().then(function(conn) {
                conn.plagiarism.insertOne(doc, function(err: Error) {
                    if (err) {
                        reject();
                    } else {
                        console.log(`Saved plagiarism results for ${proposal_hash} to Mongo`);
                        resolve();
                    }
                    conn.client.close();
                });
            });
        });

        return result_json;
    }
    
    async getDiff(proposal_hash: string): Promise<any> {
        const proposal = await this.getProposal(proposal_hash);
        const old_hash = proposal.data.trace.act.data.old_article_hash;
        const new_html = await this.wikiService.getWiki(proposal_hash);
        const old_html = await this.wikiService.getWiki(old_hash);
        return HtmlDiff.execute(old_html, new_html);
    }
}
