import { logWarning, logStandard, logError } from '../logging-tools';
const ps = require('ps-node');
import { readFileSync, existsSync } from 'fs';
import { SslConfig } from '../../common';

/**
 * Try to load the SSL key + certificate. If that doesn't work, return null
 * @param cfg SslConfig, parsed from .env
 */
export const TryResolveSslConfig = (cfg?: SslConfig): { key: string; cert: string } | null => {
    const logPrefix = 'SSL BOOTSTRAP';
    if (cfg && cfg.sslKeyPath && cfg.sslCertificatePath) {
        const pathsAreCorrect = existsSync(cfg.sslKeyPath) && cfg.sslCertificatePath;
        if (!pathsAreCorrect) {
            logWarning(`Unable to find SSL config files. check your paths`, logPrefix);
            return null;
        } else {
            let successfulRead: boolean = false;
            let returnObj = null;
            try {
                const sslKey = readFileSync(cfg.sslKeyPath, { encoding: 'utf8' });
                const sslCert = readFileSync(cfg.sslCertificatePath, { encoding: 'utf8' });
                if (sslKey && sslCert && sslKey != '' && sslCert != '') {
                    successfulRead = true;
                    returnObj = { key: sslKey, cert: sslCert };
                }
            } catch (ex) {
                logWarning(`Unable to load SSL config files: ${ex}`, logPrefix);
                successfulRead = false;
            } finally {
                return returnObj;
            }
        }
    } else {
        logStandard('SSL Config not provided', logPrefix);
        return null;
    }
};

/*
const SSL = {
    key: readFileSync('/home/kedar/certs/key.pem'),
    cert: readFileSync('/home/kedar/certs/certificate.pem')
};
*/

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
