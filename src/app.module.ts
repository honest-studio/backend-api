import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ProposalController, ProposalService } from './proposal';
import { WikiController, WikiService } from './wiki';
import { CommonModule, ConfigService, MetricsModule, MetricType } from './common';
import { RecentActivityController } from './recent-activity/recent-activity.controller';
import { RecentActivityService } from './recent-activity/recent-activity.service';
import { SitemapController, SitemapService } from './sitemap';
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
import { OAuthController, OAuthService } from './oauth';
import { EosClientModule, DatabaseModule } from './feature-modules';
import {
    GoogleAnalyticsMiddleware,
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
        EosClientModule,
        DatabaseModule,
        MetricsModule.forRoot({
            prefix: `PID_${process.pid}`,
            withDefaultsMetrics:true,
            // data available at http://localhost:{restPort}/api/v1/metrics
            defaultLabels: {
                // attach PID to this instance
                app: `PID_${process.pid}`
            }
        }),
        MetricsModule.forMetrics([
            {
                type: MetricType.Histogram,
                configuration: {
                    name: 'get_prev_by_hash_pre_sql',
                    help: 'get_prev_by_hash_pre_sql timer for get previews by hash (PRE-SQL QUERY)',
                    buckets: histogramTimerBuckets,
                    //labelNames: ['pid']
                    labelNames: histogramLabelBuckets
                }
            },
            {
                type: MetricType.Histogram,
                configuration: {
                    name: 'get_prev_by_hash_sql_only',
                    help: 'get_prev_by_hash_sql_only timer for get previews by hash (SQL QUERY ONLY)',
                    buckets: histogramTimerBuckets,
                    labelNames: histogramLabelBuckets
                }
            },
            {
                type: MetricType.Histogram,
                configuration: {
                    name: 'get_prev_by_hash_post_sql',
                    help: 'get_prev_by_hash_post_sql timer for get previews by hash (POST-SQL QUERY)',
                    buckets: histogramTimerBuckets,
                    labelNames: histogramLabelBuckets
                }
            },
            {
                type: MetricType.Histogram,
                configuration: {
                    name: 'get_prev_by_hash_total_req',
                    help: 'get_prev_by_hash_total_req timer for get previews by hash (TOTAL REQUEST)',
                    buckets: histogramTimerBuckets,
                    labelNames: histogramLabelBuckets
                }
            },
            // by slug:
            {
                type: MetricType.Histogram,
                configuration: {
                    name: 'get_prev_by_slug_pre_sql',
                    help: 'get_prev_by_slug_pre_sql timer for get previews by slug (PRE-SQL QUERY)',
                    buckets: histogramTimerBuckets,
                    labelNames: histogramLabelBuckets
                }
            },
            {
                type: MetricType.Histogram,
                configuration: {
                    name: 'get_prev_by_slug_sql_only',
                    help: 'get_prev_by_slug_sql_only timer for get previews by slug (SQL QUERY ONLY)',
                    buckets: histogramTimerBuckets,
                    labelNames: histogramLabelBuckets
                }
            },
            {
                type: MetricType.Histogram,
                configuration: {
                    name: 'get_prev_by_slug_post_sql',
                    help: 'get_prev_by_slug_post_sql timer for get previews by slug (POST-SQL QUERY)',
                    buckets: histogramTimerBuckets,
                    labelNames: histogramLabelBuckets
                }
            },
            {
                type: MetricType.Histogram,
                configuration: {
                    name: 'get_prev_by_slug_total_req',
                    help: 'get_prev_by_slug_total_req timer for get previews by slug (TOTAL REQUEST)',
                    buckets: histogramTimerBuckets,
                    labelNames: histogramLabelBuckets
                }
            }
        ]),
        ElasticsearchModule.registerAsync({
            imports: [CommonModule],
            useFactory: async (config: ConfigService) => {
                const username = config.get('ELASTICSEARCH_USERNAME');
                const password = config.get('ELASTICSEARCH_PASSWORD');
                const host = {
                    protocol: config.get('ELASTICSEARCH_PROTOCOL'),
                    host: config.get('ELASTICSEARCH_HOST'),
                    port: config.get('ELASTICSEARCH_PORT'),
                    path: config.get('ELASTICSEARCH_URL_PREFIX'),
                    auth: `${username}:${password}`
                };
                const apiVersion = '7.1'; // ignored for now
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
        ContactUsController,
        OAuthController,
        SitemapController
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
        ContactUsService,
        OAuthService,
        SitemapService
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
