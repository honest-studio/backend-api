import { DynamicModule, Global, Module } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import * as client from 'prom-client';
import { collectDefaultMetrics, DefaultMetricsCollectorConfiguration, Registry } from 'prom-client';
import { PromModuleOptions } from './prom-options.interface';
import { getRegistryName } from './prom-utils';
import { DEFAULT_PROM_OPTIONS, DEFAULT_PROM_REGISTRY, PROM_REGISTRY_NAME } from './prom.constants';


@Global()
@Module({})
export class PromCoreModule {
    constructor(private readonly moduleRef: ModuleRef) {}

    static forRoot(options: PromModuleOptions = {}): DynamicModule {
        const { withDefaultsMetrics, registryName, timeout, prefix, ...promOptions } = options;

        const promRegistryName = registryName ? getRegistryName(registryName) : DEFAULT_PROM_REGISTRY;

        const promRegistryNameProvider = {
            provide: PROM_REGISTRY_NAME,
            useValue: promRegistryName
        };

        // const promOptionName = registryName ?
        //   getOptionsName(registryName)
        //   : DEFAULT_PROM_OPTIONS;

        const promRegistryOptionsProvider = {
            provide: DEFAULT_PROM_OPTIONS,
            useValue: options
        };

        const registryProvider = {
            provide: promRegistryName,
            useFactory: (): Registry => {
                let registry = client.register;
                if (promRegistryName !== DEFAULT_PROM_REGISTRY) {
                    registry = new Registry();
                }

                if (withDefaultsMetrics !== false) {
                    const defaultMetricsOptions: DefaultMetricsCollectorConfiguration = {
                        register: registry
                    };
                    if (timeout) {
                        defaultMetricsOptions.timeout = timeout;
                    }
                    if (prefix) {
                        defaultMetricsOptions.prefix = prefix;
                    }
                    collectDefaultMetrics(defaultMetricsOptions);
                }

                return registry;
            }
        };

        return {
            module: PromCoreModule,
            providers: [promRegistryNameProvider, promRegistryOptionsProvider, registryProvider],
            exports: [registryProvider]
        };
    }

    /**
     * on destroy
     */
    onModuleDestroy() {}
}
