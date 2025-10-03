/**
 * @file The server-side implementation of the KitActions API.
 */

import type { ApiMethods, ApiMethod } from '@kitledger/actions/__definition';
import type { HttpResponse, HttpBodyRequestOptions, HttpRequestOptions } from '@kitledger/actions/http';

/**
 * A type-safe object mapping every API method to its implementation.
 */
export const apiMethodMap: ApiMethods = {
    // --- Log Implementations ---
    'log.debug': async (message, context) => console.debug('[User Script | DEBUG]:', message, context ?? ''),
    'log.info': async (message, context) => console.info('[User Script | INFO]:', message, context ?? ''),
    'log.warn': async (message, context) => console.warn('[User Script | WARN]:', message, context ?? ''),
    'log.error': async (message, context) => console.error('[User Script | ERROR]:', message, context ?? ''),
    'log.audit': async (message, context) => console.log(`%c[User Script | AUDIT]: ${message}`, 'color: blue;', context ?? ''),
    'log.emergency': async (message, context) => console.error(`%c[User Script | EMERGENCY]: ${message}`, 'color: red;', context ?? ''),

    // --- HTTP Implementations ---
    'http.get': async (url, options) => simulateFetch('GET', url, options),
    'http.post': async (url, options) => simulateFetch('POST', url, options),
    'http.put': async (url, options) => simulateFetch('PUT', url, options),
    'http.del': async (url, options) => simulateFetch('DELETE', url, options),
};

/**
 * A type-safe helper to retrieve a specific API method implementation.
 * @param methodName The unique identifier of the method to retrieve.
 * @returns The corresponding function implementation.
 */
export function getApiMethod(methodName: ApiMethod): ApiMethods[ApiMethod] {
    return apiMethodMap[methodName];
}

/**
 * A helper function to simulate network requests.
 */
async function simulateFetch<T>(method: string, url: string, options?: HttpRequestOptions | HttpBodyRequestOptions): Promise<HttpResponse<T>> {
    console.log(`HOST: Fulfilling ${method} for ${url} with`, options ?? {});
    return {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: { success: true, method, url } as T,
    };
}