import { register as Register, Counter, Histogram, Summary, collectDefaultMetrics } from 'prom-client';
import * as responseTime from 'response-time';

// adapted from https://community.tibco.com/wiki/monitoring-your-nodejs-apps-prometheus

/**
 * A Prometheus counter that counts the invocations of the different HTTP verbs
 * e.g. a GET and a POST call will be counted as 2 different calls
 */
export const numOfRequests = new Counter({
    name: 'numOfRequests',
    help: 'Number of requests made',
    labelNames: ['method']
});

/**
 * A Prometheus counter that counts the invocations with different paths
 * e.g. /foo and /bar will be counted as 2 different paths
 */
export const pathsTaken = new Counter({
    name: 'pathsTaken',
    help: 'Paths taken in the app',
    labelNames: ['path']
});

/**
 * A Prometheus summary to record the HTTP method, path, response code and response time
 */
export const responses = new Summary({
    name: 'responses',
    help: 'Response time in millis',
    labelNames: ['method', 'path', 'status']
});

/**
 * This funtion will start the collection of metrics and should be called from within in the main js file
 */
export const startCollection = () => {
    // Logger.log(Logger.LOG_INFO, `Starting the collection of metrics, the metrics are available on /metrics`);
    console.log('Starting the collection of metrics, the metrics are available on /metrics');
    collectDefaultMetrics();
};

/**
 * This function increments the counters that are executed on the request side of an invocation
 * Currently it increments the counters for numOfPaths and pathsTaken
 */
export const requestCounters = (req, res, next) => {
    if (req.path != '/metrics') {
        numOfRequests.inc({ method: req.method });
        pathsTaken.inc({ path: req.path });
    }
    next();
};

/**
 * This function increments the counters that are executed on the response side of an invocation
 * Currently it updates the responses summary
 */
export const responseCounters = responseTime((req, res: any, time) => {
    if (req.url != '/metrics') {
        responses.labels(req.method, req.url, res.statusCode).observe(time);
    }
});

/**
 * In order to have Prometheus get the data from this app a specific URL is registered
 */
export const injectMetricsRoute = (App) => {
    App.get('/metrics', (req, res) => {
        res.set('Content-Type', Register.contentType);
        res.end(Register.metrics());
    });
};

// https://github.com/digikare/nestjs-prom/blob/master/lib/common/prom.utils.ts
export function getMetricToken(type: string, name: string) {
    return `${name}${type}`;
}

export function getRegistryName(name: string) {
    return `${name}PromRegistry`;
}

export function getOptionsName(name: string) {
    return `${name}PromOptions`;
}
