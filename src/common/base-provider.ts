import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { StatusHubService } from './status-hub-service';
import { ServiceName } from '../shared';

/**
 * Abstract base class for providers
 * Child classes must still use the @Injectable decorator
 */
export abstract class BaseProvider implements OnModuleInit, OnModuleDestroy {
    constructor(protected statusHub: StatusHubService) {}

    /**
     * Reported name of service
     */
    abstract serviceName: ServiceName;

    /**
     * Register service with StatusHub and optionally call any init logic
     */
    onModuleInit() {
        if (this.onBeforeModuleInit) {
            this.onBeforeModuleInit();
        }
        this.statusHub.RegisterService(this.serviceName);
        if (this.onAfterModuleInit) {
            this.onAfterModuleInit();
        }
    }
    onModuleDestroy() {}

    /**
     * Initialization methods to execute before main module init
     */
    protected onBeforeModuleInit?(): void;

    /**
     * Initialization methods to execute after main module init
     */
    protected onAfterModuleInit?(): void;
}
