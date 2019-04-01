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
import { ContactUsController, ContactUsService } from './contact-us';
import { CacheController, CacheService } from './cache';
import { HistoryController, HistoryService } from './history';
import { MediaUploadController, MediaUploadService } from './media-upload';
import { UserController, UserService } from './user';
import { StatController, StatService } from './stat';
import { EosClientModule, DatabaseModule } from './feature-modules';
import { GoogleAnalyticsMiddleware, RequestIpMiddleware, JsonRequestMiddleware, CorsMiddleware, MorganMiddleware } from './middleware';

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
        CacheController,
        HistoryController,
        MediaUploadController,
        UserController,
        StatController,
        ContactUsController
    ],
    providers: [
        ProposalService,
        WikiService,
        RecentActivityService,
        ChainService,
        SearchService,
        DiffService,
        PreviewService,
        CacheService,
        HistoryService,
        MediaUploadService,
        UserService,
        StatService,
        ContactUsService
    ]
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        //consumer.apply(RequestIpMiddleware).forRoutes('*');
        consumer.apply(CorsMiddleware).forRoutes('*');
        consumer.apply(MorganMiddleware).forRoutes('*');
        consumer.apply(GoogleAnalyticsMiddleware).forRoutes('*');

        // Automatically set the Content-Type headers for the /v2/chain routes
        // Both eosjs and cleos don't set those headers explicitly, and Nestjs
        // doesn't read in the body with the @Body function unless that header
        // is explicitly set
        consumer.apply(JsonRequestMiddleware).forRoutes('/v2/chain');
    }
}
