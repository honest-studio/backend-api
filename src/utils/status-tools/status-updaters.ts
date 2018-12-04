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
 * Print current details on each service's status to the console
 * @param statusMapIn Status map
 */
export const PrintServiceStatus = (statusMapIn: StatusMap) => {
    for (const [key, value] of statusMapIn) {
        console.log(chalk.greenBright(`Service: ${key} :: ${value.code} -- ${value.msg}`));
    }
};
