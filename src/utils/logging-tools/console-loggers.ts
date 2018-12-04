import chalk from 'chalk';

/**
 * If a prefix has been provided, return it + a separator.
 * Otherwise return an empty string
 * @param prefix Optional prefix text
 */
const resolvePrefix = (prefix?: string): string => {
    return prefix && prefix.length > 0 ? ` -- ${prefix}` : '';
};

/**
 * If a prefix has been provided, add it + a separator to the message text
 * @param message Message to print to console
 * @param prefix Optional prefix text
 */
const resolveMessage = (message: any, prefix?: string): string | Array<any> => {
    const cleanPrefix = resolvePrefix(prefix);
    if (typeof message == 'string') {
        return `${cleanPrefix}${message}`;
    } else {
        if (cleanPrefix && cleanPrefix.length > 0) {
            return [cleanPrefix, message];
        } else {
            return message;
        }
    }
};

/**
 * Log a standard message with an optional prefix
 * @param message Message to print to console
 * @param prefix Optional prefix text
 */
export const logStandard = (message: any, prefix?: string): void => {
    console.log(resolveMessage(message, prefix));
};

/**
 * Log a warning message with an optional prefix
 * @param message Message to print to console
 * @param prefix Optional prefix text
 */
export const logWarning = (message: any, prefix?: string): void => {
    console.warn(chalk.yellowBright(resolveMessage(message, prefix) as any));
};

/**
 * Log an error message with an optional prefix
 * @param message Message to print to console
 * @param prefix Optional prefix text
 */
export const logError = (message: any, prefix?: string): void => {
    console.error(chalk.redBright(resolveMessage(message, prefix) as any));
};
