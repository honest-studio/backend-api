import { Request } from 'express';
import { getClientIp } from 'request-ip';

/**
 * Inspect a request object.
 * If it has the target headers set (where the real IP would be, as injected by the proxy), use that.
 * Else fall back to regular request IP
 * @param ctx Request object
 */
export const ResolveIpFromRequest = (ctx: Request): string => {
    // target header keys. set these carefully/in alignment with nginx proxy config. order matters.
    const targetHeaderKeys: string[] = ['x-real-ip', 'host', 'real-ip', 'x-dwarfism', 'x-forwarded-for'];
    const ipFromHeader: string[] = targetHeaderKeys
        .map((k) => {
            return ctx.headers[k] ? ctx.headers[k].toString() : null;
        })
        .filter((x) => {
            return x && x != null;
        });

    return ipFromHeader && ipFromHeader.length > 0 ? ipFromHeader[0] : getClientIp(ctx);
};

/**
 * Get the remote IP of a request, and assign it into some other object (e.g., params or request body)
 * @param orig Original body or params map
 * @param ctx Request
 */
export const AddRemoteIp = <T extends {}>(orig: T, ctx: Request): T & { remoteIp: string | null } => {
    const remoteIp = ResolveIpFromRequest(ctx);
    const cleanIp = remoteIp ? remoteIp : null;
    return { ...orig, ...{ remoteIp: cleanIp } };
};
