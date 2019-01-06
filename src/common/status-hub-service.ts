import { AppConfigVars } from './config-types';
import { validateAndBuildConfig } from './config-schema';
import { Injectable } from '@nestjs/common';
import { ServiceName, StatusWithMessage, StatusMap, ServiceStatus } from '../shared';
import { SetServiceStatus, PrintServiceStatus, GetServiceStatus } from '../utils';
import { StatusText, StatusDisposition } from '../shared/constants/logging';
import { BehaviorSubject } from 'rxjs';

/**
 * Keep track of service state
 */
@Injectable()
export class StatusHubService {
    /**
     * Private catalog of registered services and their current statuses
     */
    private registeredServices: StatusMap = new Map<ServiceName, StatusWithMessage>();

    /**
     * Public subject reflecting current state of services
     */
    public services$: BehaviorSubject<StatusMap> = new BehaviorSubject<StatusMap>(this.registeredServices);

    /**
     * Update status map of service. Notify subject on status code change, or when forced
     * @param serviceName name of service
     * @param serviceStatus new service status (default: ServiceStatus.UNKNOWN)
     * @param messageText message text (default: empty string)
     * @param forceNotify optionally force subject next() even if status code has not changed. Default: false
     */
    public HandleStatusUpdate = (
        serviceName: ServiceName,
        serviceStatus: ServiceStatus = ServiceStatus.UNKNOWN,
        messageText: string = '',
        forceNotify: boolean = false
    ) => {
        if (serviceName != undefined) {
            const hasDelta = SetServiceStatus(this.registeredServices, serviceName, serviceStatus, messageText);
            if (hasDelta || forceNotify) {
                this.services$.next(this.registeredServices);
                PrintServiceStatus(this.registeredServices);
            }
        } else {
            throw new Error(StatusText.ERR_SVC_REG_UNDEFINED_NAME);
        }
    };

    /**
     * Get the current status of a service by querying the map of registered services
     * Returns ServiceStatus.UNKNOWN if invalid/undefined
     *
     * @param serviceName Service name to query
     */
    public GetServiceStatusByName = (serviceName: ServiceName): ServiceStatus => {
        return GetServiceStatus(this.registeredServices, serviceName);
    };

    /**
     * Invoke initial registration of a service
     */
    public RegisterService = (serviceName: ServiceName) => {
        if (serviceName != undefined) {
            if (this.registeredServices.has(serviceName)) {
                throw new Error(StatusText.ERR_SVC_REG_DUPLICATE_NAME(serviceName));
            } else {
                console.log(' ===> registering service: ', serviceName);
                this.HandleStatusUpdate(serviceName, ServiceStatus.INITIAL, StatusText.INFO_SVC_INIT_OK);
            }
        } else {
            throw new Error(StatusText.ERR_SVC_REG_UNDEFINED_NAME);
        }
    };
}
