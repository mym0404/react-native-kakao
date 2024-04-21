export class KakaoJavaScriptError extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'KakaoJavaScriptError';
  }
}
