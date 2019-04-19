import { Injectable } from '@nestjs/common';
import { ServiceName, StatusWithMessage, StatusMap, ServiceStatus } from '../shared';
import { SetServiceStatus, PrintServiceStatus } from '../utils';
import { BehaviorSubject } from 'rxjs';

/**
 * Use for tracking the status of registered services
 */
@Injectable()
export class StatusHubService {
    /**
     * Private catalog of registered services and their current statuses
     */
    private registeredServices: StatusMap = new Map<ServiceName, StatusWithMessage>();

    /**
     * Public subject exposing current state of services
     */
    public service$: BehaviorSubject<StatusMap> = new BehaviorSubject<StatusMap>(this.registeredServices);

    /**
     * Update status map of service. Notify subject on status code change, or when forced
     * @param serviceName name of service in map
     * @param serviceStatus new service status (default: unknown)
     * @param messageText message text (default: empty string)
     * @param forceNotify optionally force subject next() even if status code has not changed. Default: false
     */
    private handleStatusUpdate = (
        serviceName: ServiceName,
        serviceStatus: ServiceStatus = ServiceStatus.UNKNOWN,
        messageText: string = '',
        forceNotify: boolean = false
    ): void => {
        const hasDelta = SetServiceStatus(this.registeredServices, serviceName, serviceStatus, messageText);
        if (hasDelta || forceNotify) {
            this.service$.next(this.registeredServices);
        }
    };

    constructor() {}

    public RegisterService = (serviceName: ServiceName): void => {
        if (this.registeredServices.has(serviceName)) {
            throw new Error(`Service ${serviceName} has already been registered`);
        } else {
            this.handleStatusUpdate(serviceName, ServiceStatus.INITIAL, 'Service initialized');
            // list registered services
            PrintServiceStatus(this.registeredServices);
        }
    };
}
