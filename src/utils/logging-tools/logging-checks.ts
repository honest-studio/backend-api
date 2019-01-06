import { StatusText, StatusDisposition, AllStatusDispositions } from '../../shared/constants/logging';

/**
 * Checks to see if given log entries match certain conditions
 */
export class LoggingChecks {
    /**
     * See if the prefix of a log message matches the provided argument
     */
    private static matchPrefix = (logMsg: string, prefixTxt: string): boolean => {
        if (logMsg && logMsg.length > prefixTxt.length) {
            return logMsg.substr(0, prefixTxt.length) == prefixTxt;
        } else {
            return false;
        }
    };

    /**
     * If the prefix of a log message matches the provided argument, remove it
     */
    private static removePrefixIfSet = (logMsg: string, prefixTxt: string): string => {
        if (logMsg) {
            if (LoggingChecks.matchPrefix(logMsg, prefixTxt)) {
                return logMsg.replace(prefixTxt, '');
            } else {
                return logMsg;
            }
        } else {
            return '';
        }
    };

    /**
     * Check whether the provided message has an [ERR] prefix
     */
    public static IS_ERROR = (logMsg: string): boolean => {
        return LoggingChecks.matchPrefix(logMsg, StatusText.PREFIX_ERR);
    };

    /**
     * Check whether the provided message has a [WARN] prefix
     */
    public static IS_WARNING = (logMsg: string): boolean => {
        return LoggingChecks.matchPrefix(logMsg, StatusText.PREFIX_WARN);
    };

    /**
     * Check whether the provided message has a [INFO] prefix
     */
    public static IS_INFO = (logMsg: string): boolean => {
        return LoggingChecks.matchPrefix(logMsg, StatusText.PREFIX_INFO);
    };

    /**
     * Check whether the provided message has a [UNSPECIFIED] prefix
     */
    public static IS_UNSPECIFIED = (logMsg: string): boolean => {
        return LoggingChecks.matchPrefix(logMsg, StatusText.PREFIX_UNSPECIFIED);
    };

    /**
     * Allow only the provided prefixType argument. Strip any others
     * @param logMsg message to clean and reformat
     * @param prefixType Only prefix type to allow
     */
    public static ForceMsgPrefix = (logMsg: string, prefixType: StatusDisposition) => {
        return AllStatusDispositions.reduce((acc, iter) => {
            const pfx = StatusText.GetPrefix(iter);
            if (iter == prefixType) {
                const hasPrefixAlready = LoggingChecks.matchPrefix(acc, pfx);
                return hasPrefixAlready ? acc : StatusText.FORMAT_MSG(acc, iter);
            } else {
                return LoggingChecks.removePrefixIfSet(acc, pfx);
            }
        }, logMsg);
    };
}
