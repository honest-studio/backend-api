import { Module, DynamicModule, NestModule, MiddlewareConsumer, Inject, RequestMethod } from '@nestjs/common';
import { PromCoreModule } from './prom-core.module';
import { MetricTypeConfigurationInterface, MetricType } from './metric.type';
import { PromModuleOptions } from './prom-options.interface'
import {
    createPromCounterProvider,
    createPromGaugeProvider,
    createPromHistogramProvider,
    createPromSummaryProvider
} from './prom.providers';
import * as client from 'prom-client';
import { MetricsController } from './metrics.controller';
import { InboundMiddleware } from './inbound.middleware';
import { DEFAULT_PROM_OPTIONS } from './prom.constants';

@Module({})
export class MetricsModule {
    static forRoot(options: PromModuleOptions = {}): DynamicModule {
        const { withDefaultController, useHttpCounterMiddleware, ...promOptions } = options;

        const moduleForRoot: DynamicModule = {
            module: MetricsModule,
            imports: [PromCoreModule.forRoot(options)],
            controllers: [],
            exports: [],
            providers: []
        };

        // default push default controller
        if (withDefaultController !== false) {
            moduleForRoot.controllers = [...moduleForRoot.controllers, MetricsController];
        }

        // if want to use the http counter
        if (useHttpCounterMiddleware) {
            const inboundProvider = createPromCounterProvider({
                name: 'http_requests_total',
                help: 'http_requests_total Number of inbound request',
                labelNames: ['method']
            });

            moduleForRoot.providers = [...moduleForRoot.providers, inboundProvider];
            moduleForRoot.exports = [...moduleForRoot.exports, inboundProvider];
        }

        return moduleForRoot;
    }

    static forMetrics(metrics: MetricTypeConfigurationInterface[]): DynamicModule {
        const providers = metrics.map((entry) => {
            switch (entry.type) {
                case MetricType.Counter:
                    return createPromCounterProvider(entry.configuration);
                case MetricType.Gauge:
                    return createPromGaugeProvider(entry.configuration);
                case MetricType.Histogram:
                    return createPromHistogramProvider(entry.configuration);
                case MetricType.Summary:
                    return createPromSummaryProvider(entry.configuration);
                default:
                    throw new ReferenceError(`The type ${entry.type} is not supported`);
            }
        });

        return {
            module: MetricsModule,
            providers: providers,
            exports: providers
        };
    }

    static forCounter(configuration: client.CounterConfiguration): DynamicModule {
        const provider = createPromCounterProvider(configuration);
        return {
            module: MetricsModule,
            providers: [provider],
            exports: [provider]
        };
    }

    static forGauge(configuration: client.GaugeConfiguration): DynamicModule {
        const provider = createPromGaugeProvider(configuration);
        return {
            module: MetricsModule,
            providers: [provider],
            exports: [provider]
        };
    }

    static forHistogram(configuration: client.HistogramConfiguration): DynamicModule {
        const provider = createPromHistogramProvider(configuration);
        return {
            module: MetricsModule,
            providers: [provider],
            exports: [provider]
        };
    }

    static forSummary(configuration: client.SummaryConfiguration): DynamicModule {
        const provider = createPromSummaryProvider(configuration);
        return {
            module: MetricsModule,
            providers: [provider],
            exports: [provider]
        };
    }
}