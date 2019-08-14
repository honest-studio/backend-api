import { Injectable } from '@nestjs/common';
import { DiffService } from '../diff';
import { RedisService, MysqlService } from '../feature-modules/database';
import { Proposal, ProposalOptions, ProposalService } from '../proposal';

@Injectable()
export class HistoryService {
    constructor(
        private mysql: MysqlService,
        private redis: RedisService,
        private proposalService: ProposalService,
        private diffService: DiffService
    ) {}

    async getWikiHistory(lang_code: string, slug: string, options: ProposalOptions): Promise<Array<Proposal>> {
        // the slugs are sometimes getting submitted with URL encoding
        // idk why, I just work with what I have ¯\_(ツ)_/¯
        // so we search for both regular and encoded slugs
        const mysql_slug = this.mysql.cleanSlugForMysql(slug);
        const encoded_slug = encodeURIComponent(slug);
        const encoded_mysql_slug = encodeURIComponent(mysql_slug);

        const pipeline = this.redis.connection().pipeline();
        pipeline.zrevrange(`wiki:lang_${lang_code}:${slug}:proposals`, 0, -1);
        pipeline.zrevrange(`wiki:lang_${lang_code}:${mysql_slug}:proposals`, 0, -1);
        pipeline.zrevrange(`wiki:lang_${lang_code}:${encoded_slug}:proposals`, 0, -1);
        pipeline.zrevrange(`wiki:lang_${lang_code}:${encoded_mysql_slug}:proposals`, 0, -1);
        const values = await pipeline.exec();

        const value = values.find(v => v[1]);
        if (!value) return []; // no history
        const proposal_ids = value[1];

        const proposals = await this.proposalService.getProposals(proposal_ids, options);

        return proposals;
    }
}
