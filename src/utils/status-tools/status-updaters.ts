import { ServiceStatus, ServiceName, StatusMap, StatusWithMessage } from '../../shared';
import chalk from 'chalk';

/**
 * Update a service status map. Return true if the status code has been changed, else false
 * @param statusMapIn Map object to update
 * @param serviceName Name of service as (map key enum) to update
 * @param newStatusCode New status code (default: Unknown)
 * @param messageText Optional message text to include (default: empty string)
 */
export const SetServiceStatus = (
    statusMapIn: StatusMap,
    serviceName: ServiceName,
    newStatusCode: ServiceStatus = ServiceStatus.UNKNOWN,
    messageText: string = ''
): boolean => {
    const newStatusRecord = { code: newStatusCode, msg: messageText, time: Date.now() };
    const prevStatusCode = statusMapIn.has(serviceName) ? statusMapIn.get(serviceName).code : ServiceStatus.UNKNOWN;
    statusMapIn.set(serviceName, newStatusRecord);
    return prevStatusCode != newStatusCode;
};

/**
 * Print current details on each service to the console
 * @param statusMapIn Map object to load statuses from
 */
export const PrintServiceStatus = (statusMapIn: StatusMap) => {
    console.log(chalk.black.bgCyan(`\n[Services] as of ${new Date().toTimeString()}`));
    for (const [key, value] of statusMapIn) {
        console.log(chalk.bgBlue(`    [Service] ${key}:: ${value.code} -- ${value.msg}`));
    }
};

/**
 * Transform a service status map into a plain JSON object
 *
 * @param statusMapIn Map object convert to JSON
 */
export const StatusMapToJson = (statusMapIn: StatusMap): { [serviceName: string]: StatusWithMessage } => {
    return Array.from(statusMapIn.keys()).reduce((acc, iter) => {
        return Object.assign(acc, { [iter]: statusMapIn.get(iter) });
    }, {});
};

/**
 * Get the current status of a service by querying on its name.
 * Returns ServiceStatus.UNKNOWN if invalid/undefined
 *
 * @param statusMapIn Map object to load statuses from
 * @param serviceName Service name to query
 */
export const GetServiceStatus = (statusMapIn: StatusMap, serviceName: ServiceName): ServiceStatus => {
    if (statusMapIn && serviceName && statusMapIn.has(serviceName)) {
        const mapVal = statusMapIn.get(serviceName);
        if (mapVal) {
            return mapVal.code;
        } else {
            return ServiceStatus.UNKNOWN;
        }
    } else {
        return ServiceStatus.UNKNOWN;
    }
};
