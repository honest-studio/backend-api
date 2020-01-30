import { Injectable } from '@nestjs/common';
import { MysqlService, MongoDbService } from '../feature-modules/database';

@Injectable()
export class CuratedService {
    constructor( 
        private mysql: MysqlService, 
        private mongo: MongoDbService ) {}

    async getLists(options): Promise<any> {
        const query = {
            'trace.act.account': 'eparticlectr',
            'trace.act.name': 'curatelist'
        };
        if (options.user) query['trace.act.data.user'] = options.user

        const docs = await this.mongo.connection().actions
            .find(query)
            .limit(options.limit)
            .toArray();

        return docs;
    }
}
