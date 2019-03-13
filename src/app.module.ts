import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ProposalController, ProposalService } from './proposal';
import { WikiController, WikiService } from './wiki';
import { CommonModule, ConfigService } from './common';
import { RecentActivityController } from './recent-activity/recent-activity.controller';
import { RecentActivityService } from './recent-activity/recent-activity.service';
import { ChainController, ChainService } from './chain';
import { DiffController, DiffService } from './diff';
import { PreviewController, PreviewService } from './preview';
import { SearchController, SearchService } from './search';
import { CacheController, CacheService } from './cache';
import { EosClientModule, DatabaseModule } from './feature-modules';
import { RequestIpMiddleware } from './middleware';

@Module({
    imports: [
        CommonModule,
        EosClientModule,
        DatabaseModule,
        ElasticsearchModule.registerAsync({
            imports: [CommonModule],
            useFactory: async (config: ConfigService) => {
                const elasticConfig = config.get('elasticSearchConfig');
                const username = elasticConfig.elasticSearchUsername;
                const password = elasticConfig.elasticSearchPassword;
                const host = {
                    protocol: elasticConfig.elasticSearchProtocol,
                    host: elasticConfig.elasticSearchHost,
                    port: elasticConfig.elasticSearchPort,
                    path: elasticConfig.elasticSearchUrlPrefix,
                    auth: `${username}:${password}`
                };
                const apiVersion = '6.5'; // ignored for now
                return { host, apiVersion };
            },
            inject: [ConfigService]
        })
    ],
    controllers: [
        ProposalController,
        WikiController,
        RecentActivityController,
        ChainController,
        SearchController,
        DiffController,
        PreviewController,
        CacheController
    ],
    providers: [
        ProposalService,
        WikiService,
        RecentActivityService,
        ChainService,
        SearchService,
        DiffService,
        PreviewService,
        CacheService
    ]
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestIpMiddleware).forRoutes('v1/search');
    }
}
