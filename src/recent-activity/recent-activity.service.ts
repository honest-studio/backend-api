import { Injectable } from '@nestjs/common';
import { MongoDbService } from '../feature-modules';
import { IpfsService } from '../common';

@Injectable()
export class RecentActivityService {
    private readonly ipfsService: IpfsService;
    private readonly mongoDbService: MongoDbService;

    constructor(ipfs: IpfsService, mongo:MongoDbService) {
        this.ipfsService = ipfs;
        this.mongoDbService = mongo; 
    }

    async getAll(query): Promise<Array<any>> {
        const docs = await this.mongoDbService.connection().then((con) =>
            con.actions.find({
                'data.trace.act.account': 'eparticlectr'
            })
        );
        return docs
            .sort({ 'data.block_num': -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();
    }

    async getResults(query): Promise<Array<any>> {
        const results = await this.mongoDbService.connection().then((con) =>
            con.actions.find({
                'data.trace.act.account': 'eparticlectr',
                'data.trace.act.name': 'logpropres'
            })
        );
        return results
            .sort({ 'data.block_num': -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();
    }

    async getProposals(query): Promise<Array<any>> {
        const docs = await this.mongoDbService.connection().then((con) =>
            con.actions.find({
                'data.trace.act.account': 'eparticlectr',
                'data.trace.act.name': 'propose'
            })
        );

        const proposals = await docs
            .sort({ 'data.block_num': -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();

        if (query.preview) {
            for (const i in proposals) {
                const proposal = proposals[i];

                const hash: string = proposal.data.trace.act.data.proposed_article_hash;
                const buffer: Buffer = await this.ipfsService.client().cat(hash);
                const wiki = buffer.toString('utf8');

                let title: string = '';
                const titleIndex = wiki.indexOf(`<h1 class="page-title">`);
                if (titleIndex != -1) {
                    const titleStartIndex = titleIndex + 23;
                    const titleEndIndex = wiki.indexOf(`</h1>`, titleStartIndex);
                    title = wiki
                        .substring(titleStartIndex, titleEndIndex)
                        .replace(/\n/g, '')
                        .trim();
                }

                let thumbnail: string = '';
                let mainimage: string = '';
                const thumbnailIndex = wiki.indexOf(`class="main-photo no-edit" data-thumbnail="`);
                if (thumbnailIndex != -1) {
                    const thumbnailStartIndex = thumbnailIndex + 43;
                    const thumbnailEndIndex = wiki.indexOf(`" src="`, thumbnailStartIndex);
                    thumbnail = wiki
                        .substring(thumbnailStartIndex, thumbnailEndIndex)
                        .replace(/\n/g, '')
                        .trim();

                    const mainimageStartIndex = thumbnailEndIndex + 7;
                    const mainimageEndIndex = wiki.indexOf(`"/>`, mainimageStartIndex);
                    mainimage = wiki
                        .substring(mainimageStartIndex, mainimageEndIndex)
                        .replace(/\n/g, '')
                        .trim();
                }

                proposals[i].preview = { title, thumbnail, mainimage };
            }
        }

        return proposals;
    }

    async getVotes(query): Promise<Array<any>> {
        const votes = await this.mongoDbService.connection().then((con) =>
            con.actions.find({
                'data.trace.act.account': 'eparticlectr',
                'data.trace.act.name': 'votebyhash'
            })
        );
        return votes
            .sort({ 'data.block_num': -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();
    }

    async getWikis(query): Promise<any> {
        const results = await this.mongoDbService.connection().then((con) =>
            con.actions.find({
                'data.trace.act.account': 'eparticlectr',
                'data.trace.act.name': 'logpropres',
                'data.trace.act.data.approved': 1
            })
        );
        return results
            .sort({ 'data.block_num': -1 })
            .skip(query.offset)
            .limit(query.limit)
            .toArray();
    }
}
