import { DfuseConfig } from '../../common';

/**
 * Build Dfuse connection URL for websocket API
 * @param cfg DfuseConfig instance
 */
export const BuildDfuseWebSocketEndpointUrl = (cfg: DfuseConfig): string => {
    return `${cfg.dfuseWsEndpoint}?token=${cfg.dfuseApiKey}`;
};

/**
 * Build Dfuse connection headers (with origin from config)
 * @param cfg DfuseConfig instance
 */
export const BuildDfuseConnectionHeaders = (cfg: DfuseConfig) => {
    return {
        headers: {
            Origin: cfg.dfuseOriginUrl
        }
    } as any;
};
