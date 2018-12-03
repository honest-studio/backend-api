import { logWarning, logStandard, logError } from '../logging-tools';
const ps = require('ps-node');

/**
 * Check whether IPFS is currently running by looking at process list names
 * Should work across windows, linux, and mac os
 * This takes a few seconds on Windows.
 */
export async function isIpfsRunning() {
    const logPrefix = 'IPFS STATUS';
    const query = `ipfs`;
    logStandard('Checking whether IPFS is running..');

    return new Promise<boolean>((resolve, reject) => {
        ps.lookup(
            {
                command: query
            },
            (err: any, resultList: any[]) => {
                if (err) {
                    logError(err, logPrefix);
                    reject(new Error(err));
                } else {
                    if (resultList && resultList.length > 0) {
                        logStandard('IPFS is running!', logPrefix);
                        resolve(true);
                    } else {
                        logWarning(`The IPFS daemon does not appear to be running`, logPrefix);
                        resolve(false);
                    }
                }
            }
        );
    });
}
