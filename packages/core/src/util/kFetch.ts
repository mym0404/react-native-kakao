import type { FetchArgs, ReturnFetchDefaultOptions } from 'return-fetch';
import returnFetch from 'return-fetch';

import { kCreateWebError } from './kCreateWebError';

// Use as a replacer of `RequestInit`
type JsonRequestInit = Omit<NonNullable<FetchArgs[1]>, 'body'> & { body?: object };

// Use as a replacer of `Response`
type ResponseGenericBody<T> = Omit<Awaited<ReturnType<typeof fetch>>, keyof Body | 'clone'> & {
  body: T;
};

type JsonResponse<T> = T extends object ? ResponseGenericBody<T> : ResponseGenericBody<string>;

// this resembles the default behavior of axios json parser
// https://github.com/axios/axios/blob/21a5ad34c4a5956d81d338059ac0dd34a19ed094/lib/defaults/index.js#L25
const parseJsonSafely = (text: string): object | string => {
  try {
    return JSON.parse(text);
  } catch (e) {
    if ((e as Error).name !== 'SyntaxError') {
      throw e;
    }

    return text.trim();
  }
};

function jsonToFormUrlEncoded(json: Record<string, any>) {
  return Object.keys(json)
    .map((key) => key + '=' + json[key])
    .join('&');
}

// Write your own high order function to serialize request body and deserialize response body.
const returnFetchJson = (args?: ReturnFetchDefaultOptions, formUrlEncoded = false) => {
  const fetch = returnFetch(args);

  return async <T>(url: FetchArgs[0], init?: JsonRequestInit): Promise<JsonResponse<T>> => {
    const response = await fetch(url, {
      ...init,
      body:
        init?.body &&
        (!formUrlEncoded ? JSON.stringify(init.body) : jsonToFormUrlEncoded(init.body)),
      headers: {
        ...(init?.method?.toLowerCase() === 'post'
          ? {
              'Content-type': formUrlEncoded
                ? 'application/x-www-form-urlencoded;charset=utf-8'
                : 'application/json;charset=utf-8',
            }
          : {}),
        ...init?.headers,
      },
    });

    if (response.status === 401) {
      throw kCreateWebError({
        code: -401 + '',
        isAuthFailed: true,
        msg: 'this access token does not exist',
      });
    }

    const body = parseJsonSafely(await response.text()) as T;

    return {
      headers: response.headers,
      ok: response.ok,
      redirected: response.redirected,
      status: response.status,
      statusText: response.statusText,
      type: response.type,
      url: response.url,
      body,
    } as JsonResponse<T>;
  };
};

export const kFetch = returnFetchJson({}, false);
export const kFetchFormUrlEncoded = returnFetchJson({}, true);
