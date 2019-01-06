/**
 * Disposition of different status codes
 */
export enum StatusDisposition {
    INFO = 'INFO',
    WARN = 'WARN',
    ERR = 'ERR',
    UNSPECIFIED = 'UNSPECIFIED'
}

/**
 * All status dispositions as a handy array
 */
export const AllStatusDispositions: StatusDisposition[] = [
    StatusDisposition.INFO,
    StatusDisposition.WARN,
    StatusDisposition.ERR,
    StatusDisposition.UNSPECIFIED
];

/**
 * Some common error and status messages
 */
export class StatusText {
    /**
     * Standard prefix for error message ('[ERR]') and a trailing space
     */
    static PREFIX_ERR: string = '[ERR] ';
    /**
     * Standard prefix for warning message ('[WARN]') and a trailing space
     */
    static PREFIX_WARN: string = '[WARN] ';
    /**
     * Standard prefix for info message ('[INFO]') and a trailing space
     */
    static PREFIX_INFO: string = '[INFO] ';

    /**
     * Standard prefix for unspecified message type ('[UNSPECIFIED]') and a trailing space
     */
    static PREFIX_UNSPECIFIED: string = '[UNSPECIFIED] ';

    /**
     * For a given status disposition, resolve the appropriate prefix
     * @param disposition string enum of {StatusDisposition}
     */
    static GetPrefix = (disposition: StatusDisposition): string => {
        switch (disposition) {
            case StatusDisposition.ERR:
                return StatusText.PREFIX_ERR;
            case StatusDisposition.WARN:
                return StatusText.PREFIX_WARN;
            case StatusDisposition.INFO:
                return StatusText.PREFIX_INFO;
            default:
                return StatusText.PREFIX_UNSPECIFIED;
        }
    };

    /**
     * Prepend the error prefix before a message
     * @param msg message text to format
     */
    static FORMAT_ERR_MSG = (msg: string): string => {
        return `${StatusText.PREFIX_ERR}${msg}`;
    };

    /**
     * Prepend the warning prefix before a message
     * @param msg message text to format
     */
    static FORMAT_WARN_MSG = (msg: string): string => {
        return `${StatusText.PREFIX_WARN}${msg}`;
    };

    /**
     * Prepend the info prefix before a message
     * @param msg message text to format
     */
    static FORMAT_INFO_MSG = (msg: string): string => {
        return `${StatusText.PREFIX_INFO}${msg}`;
    };

    /**
     * Prepend a prefix based on status disposition before a message
     * @param msg message text to format
     * @param disposition status disposition enum
     */
    static FORMAT_MSG = (msg: string, disposition: StatusDisposition): string => {
        return `${StatusText.GetPrefix(disposition)}${msg}`;
    };

    /**
     * Error: An unknown error has occurred
     */
    static get ERR_UNKNOWN(): string {
        return StatusText.FORMAT_ERR_MSG('An unknown error has occurred');
    }

    /**
     * Error: Failed to establish a connection to database
     */
    static get ERR_DB_CONN_NOT_ESTABLISHED(): string {
        return StatusText.FORMAT_ERR_MSG('Failed to establish a connection to database');
    }

    /**
     * Error: Connection has not been initialized
     */
    static get ERR_DB_CONN_NOT_INITIALIZED(): string {
        return StatusText.FORMAT_ERR_MSG('Connection has not been initialized');
    }

    /**
     * Error: Undefined service name provided, unable to update status
     */
    static get ERR_SVC_REG_UNDEFINED_NAME(): string {
        return StatusText.FORMAT_ERR_MSG('Undefined service name provided, unable to update status');
    }

    /**
     * Error: Service {svcName} has already been registered
     * @param svcName name of service that user attempted to register
     */
    static ERR_SVC_REG_DUPLICATE_NAME = (svcName: string): string => {
        return StatusText.FORMAT_ERR_MSG(`Service ${svcName} has already been registered`);
    };

    /**
     * Error: No valid data loaded
     */
    static get ERR_NO_VALID_DATA(): string {
        return StatusText.FORMAT_ERR_MSG('No valid data loaded');
    }

    /**
     * Warning: No records returned- empty dataset
     */
    static get WARN_NO_RECORDS_RETURNED(): string {
        return StatusText.FORMAT_WARN_MSG('No records returned- empty dataset');
    }

    /**
     * Info: Service waiting to start
     */
    static get INFO_SVC_WAITING_TO_START(): string {
        return StatusText.FORMAT_INFO_MSG('Service waiting to start');
    }

    /**
     * Info: Loading initial data
     */
    static get INFO_LOADING_INITIAL_DATA(): string {
        return StatusText.FORMAT_INFO_MSG('Loading initial data');
    }

    /**
     * Info: Loaded n records
     * @param numRecords number as a count, or an array from which to derive count
     */
    static INFO_LOADED_RECORDS_OK = (numRecords: number | any[]): string => {
        const numberToUse: number = Array.isArray(numRecords) ? numRecords.length : numRecords;
        return StatusText.FORMAT_INFO_MSG(`Loaded ${numberToUse} records`);
    };

    /**
     * Info: Service successfully initialized
     */
    static get INFO_SVC_INIT_OK(): string {
        return StatusText.FORMAT_INFO_MSG('Service successfully initialized');
    }
}
