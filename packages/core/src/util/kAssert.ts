import { KakaoJavaScriptError } from './KakaoJavaScriptError';

export function kAssert(condition: boolean, message: string) {
  if (!condition) {
    throw new KakaoJavaScriptError(message);
  }
}
