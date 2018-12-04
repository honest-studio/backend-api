import { ServiceName } from '../../constants';

/**
 * Standard code to describe current status of a service or provider
 */
export enum ServiceStatus {
    /**
     * Unknown- unable to determine state
     */
    UNKNOWN = 'UNKNOWN',
    /**
     * Initial state- start not attempted
     */
    INITIAL = 'INITIAL',
    /**
     * Configured, but not yet started
     */
    NOT_STARTED = 'NOT_STARTED',
    /**
     * Currently starting
     */
    STARTING = 'STARTING',
    /**
     * Currently running normally
     */
    RUNNING = 'RUNNING',
    /**
     * Currently stopping
     */
    STOPPING = 'STOPPING',
    /**
     * Stopped normally, no errors
     */
    STOPPED = 'STOPPED',
    /**
     * Running, but with warning- see message
     */
    RUNNING_WITH_WARNING = 'RUNNING_WITH_WARNING',
    /**
     * Critical error, see message
     */
    ERROR = 'ERROR'
}

/**
 * Service status code, time updated, and message string
 */
export type StatusWithMessage = {
    /**
     * Status code
     */
    code: ServiceStatus;
    /**
     * Message text
     */
    msg: string;
    /**
     * Timestamp updated, as number
     */
    time: number;
};

/**
 * Map of service names to status codes + info
 */
export type StatusMap = Map<ServiceName, StatusWithMessage>;
