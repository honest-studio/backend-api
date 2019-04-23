import * as PromClient from 'prom-client';

export enum MetricType {
    Counter,
    Gauge,
    Histogram,
    Summary
}

export interface MetricTypeConfigurationInterface {
    type: MetricType;
    configuration?: any;
}

export class MetricTypeCounter implements MetricTypeConfigurationInterface {
    type: MetricType = MetricType.Counter;
    configuration: PromClient.CounterConfiguration;
}

export class MetricTypeGauge implements MetricTypeConfigurationInterface {
    type: MetricType = MetricType.Gauge;
    configuration: PromClient.GaugeConfiguration;
}

export class MetricTypeHistogram implements MetricTypeConfigurationInterface {
    type: MetricType = MetricType.Histogram;
    configuration: PromClient.HistogramConfiguration;
}

export class MetricTypeSummary implements MetricTypeConfigurationInterface {
    type: MetricType = MetricType.Summary;
    configuration: PromClient.SummaryConfiguration;
}

// map class to expose
export class CounterMetric extends PromClient.Counter {}
export class GaugeMetric extends PromClient.Gauge {}
export class HistogramMetric extends PromClient.Histogram {}
export class SummaryMetric extends PromClient.Summary {}
