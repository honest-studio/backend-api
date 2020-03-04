import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ProposalController, ProposalService } from './proposal';
import { WikiController, WikiService } from './wiki';
import { CommonModule, ConfigService } from './common';
import { RecentActivityController } from './recent-activity/recent-activity.controller';
import { RecentActivityService } from './recent-activity/recent-activity.service';
import { SitemapController, SitemapService } from './sitemap';
import { ChainController, ChainService } from './chain';
import { DiffService } from './diff';
import { PreviewController, PreviewService } from './preview';
import { SearchController, SearchService } from './search';
import { ContactUsController, ContactUsService } from './contact-us';
import { HistoryController, HistoryService } from './history';
import { CategoryController, CategoryService } from './category';
import { HomepageController, HomepageService } from './homepage';
import { MediaUploadController, MediaUploadService } from './media-upload';
import { UserController, UserService } from './user';
import { StatController, StatService } from './stat';
import { CuratedController, CuratedService } from './curated';
import { StatusController } from './status/status.controller';
import { DatabaseModule } from './feature-modules';
import {
    AnalyticsMiddleware,
    RequestIpMiddleware,
    JsonRequestMiddleware,
    CorsMiddleware,
    MorganMiddleware
} from './middleware';

// timer buckets by ms. each bucket is <value. must scale all down by 10e9 because of process.hrtime
const histogramTimerBuckets = [50, 100, 200, 500, 1000, 5000, 30000];
const histogramLabelBuckets = ['pid']

@Module({
    imports: [
        CommonModule,
        DatabaseModule,
        ElasticsearchModule.registerAsync({
            imports: [CommonModule],
            useFactory: async (config: ConfigService) => ({
                node: `${config.get('ELASTICSEARCH_PROTOCOL')}://${config.get('ELASTICSEARCH_HOST')}:${config.get('ELASTICSEARCH_PORT')}${config.get('ELASTICSEARCH_URL_PREFIX')}`,
                auth: {
                    username: config.get('ELASTICSEARCH_USERNAME'),
                    password: config.get('ELASTICSEARCH_PASSWORD')
                }
            }),  
            inject: [ConfigService]
        })
    ],


    // const username = config.get('ELASTICSEARCH_USERNAME');
    // const password = config.get('ELASTICSEARCH_PASSWORD');
    // const host = {
        // protocol: config.get('ELASTICSEARCH_PROTOCOL'),
        // host: config.get('ELASTICSEARCH_HOST'),
        // port: config.get('ELASTICSEARCH_PORT'),
        // path: config.get('ELASTICSEARCH_URL_PREFIX'),
        // auth: `${config.get('ELASTICSEARCH_USERNAME')}:${config.get('ELASTICSEARCH_PASSWORD')}`
    // };
    // const apiVersion = '7.1'; // ignored for now
    // return { host, apiVersion };

    controllers: [
        ProposalController,
        WikiController,
        RecentActivityController,
        ChainController,
        SearchController,
        PreviewController,
        HistoryController,
        MediaUploadController,
        UserController,
        StatController,
        ContactUsController,
        CuratedController,
        SitemapController,
        StatusController,
        CategoryController,
        HomepageController
    ],
    providers: [
        ProposalService,
        WikiService,
        RecentActivityService,
        ChainService,
        SearchService,
        DiffService,
        PreviewService,
        HistoryService,
        MediaUploadService,
        UserService,
        StatService,
        CuratedService,
        ContactUsService,
        SitemapService,
        CategoryService,
        HomepageService
    ]
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        //consumer.apply(RequestIpMiddleware).forRoutes('*');
        consumer.apply(CorsMiddleware).forRoutes('*');
        consumer.apply(MorganMiddleware).forRoutes('*');
        consumer.apply(AnalyticsMiddleware).forRoutes('*');

        // Automatically set the Content-Type headers for the /v2/chain routes
        // Both eosjs and cleos don't set those headers explicitly, and Nestjs
        // doesn't read in the body with the @Body function unless that header
        // is explicitly set
        consumer.apply(JsonRequestMiddleware).forRoutes('/v2/chain');
    }
}
