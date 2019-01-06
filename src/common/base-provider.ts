import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ServiceName, ServiceStatus } from '../shared';
import { LoggingChecks } from '../utils/logging-tools';
import { StatusText, StatusDisposition } from '../shared/constants/logging';
import { StatusHubService } from './status-hub-service';

/**
 * Abstract base class for providers in app
 * Child modules must still use the @Injectable decorator
 */
export abstract class BaseProvider implements OnModuleInit, OnModuleDestroy {
    /**
     * Reported name of service, set at creation
     */
    protected readonly serviceName: ServiceName;

    /**
     * Register the service with the StatusHub
     */
    private handleRegistration = () => {
        this.statusHub.RegisterService(this.serviceName);
    };

    /**
     * Get the current status of a service by querying the StatusHub service of registered services
     */
    get serviceStatus(): ServiceStatus {
        return this.statusHub.GetServiceStatusByName(this.serviceName);
    }

    /**
     * Construct a new provider
     * @param statusHub pass a {StatusHubService} from child
     * @param svcName pass a {ServiceName} enum from child
     */
    constructor(protected statusHub: StatusHubService, svcName: ServiceName) {
        this.serviceName = svcName;
        this.handleRegistration();
    }

    /**
     * Update status hub record for this service. Notify subject on status code change, or when forced
     * @param serviceStatus new service status
     * @param messageText message text (default: empty string)
     * @param forceNotify optionally force subject next() even if status code has not changed. Default: false
     */
    protected serviceStatusUpdate = (
        serviceStatus: ServiceStatus,
        messageText: string = '',
        forceNotify: boolean = false
    ) => {
        this.statusHub.HandleStatusUpdate(this.serviceName, serviceStatus, messageText, forceNotify);
    };

    /**
     * On module init, set the service status to "NOT_STARTED"
     * Automatically called on instantiation
     */
    onModuleInit() {
        if (this.onBeforeModuleInit) {
            this.onBeforeModuleInit();
        }
        this.serviceStatusUpdate(ServiceStatus.NOT_STARTED, StatusText.INFO_SVC_WAITING_TO_START);
        if (this.onAfterModuleInit) {
            this.onAfterModuleInit();
        }
    }

    /**
     * On module destroy, set the service status to "NOT_STARTED"
     * Automatically called if module is disposted
     */
    onModuleDestroy() {
        if (this.onBeforeServiceStopped) {
            this.onBeforeServiceStopped();
        }

        this.serviceStatusUpdate(ServiceStatus.STOPPED, 'Stopped');
        if (this.onAfterServiceStopped) {
            this.onAfterServiceStopped();
        }
    }

    /**
     * Report service started successfully. Will format message as INFO in logs if not already formatted
     * Manually call in child.
     * @param message Message string to log
     */
    onServiceStarted = (message: string = 'Service started'): void => {
        if (this.onBeforeServiceStarted) {
            this.onBeforeServiceStarted();
        }

        this.serviceStatusUpdate(ServiceStatus.RUNNING, LoggingChecks.ForceMsgPrefix(message, StatusDisposition.INFO));
        if (this.onAfterServiceStarted) {
            this.onAfterServiceStarted();
        }
    };

    /**
     * Report service error status. Will format message
     * Call when an error is caught.
     * @param message Message string to log
     */
    onServiceError = (message: string = 'Unknown Error'): void => {
        if (this.onBeforeServiceError) {
            this.onBeforeServiceError();
        }
        this.serviceStatusUpdate(ServiceStatus.ERROR, LoggingChecks.ForceMsgPrefix(message, StatusDisposition.ERR));
        // this.serviceStatusUpdate(ServiceStatus.ERROR, message);
        if (this.onAfterServiceError) {
            this.onAfterServiceError();
        }
    };

    /**
     * Initialization methods to execute before main module init
     */
    protected onBeforeModuleInit?(): void;

    /**
     * Initialization methods to execute after main module init
     */
    protected onAfterModuleInit?(): void;

    /**
     * Optionally, call before service start is reported
     */
    protected onBeforeServiceStarted?(): void;

    /**
     * Optionally, call after service start is reported
     */
    protected onAfterServiceStarted?(): void;

    /**
     * Optionally, call before service stop is reported
     */
    protected onBeforeServiceStopped?(): void;

    /**
     * Optionally, call after service stop is reported
     */
    protected onAfterServiceStopped?(): void;

    /**
     * Optionally, call before service error is reported
     */
    protected onBeforeServiceError?(): void;

    /**
     * Optionally, call after service error is reported
     */
    protected onAfterServiceError?(): void;
}
