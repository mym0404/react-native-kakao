import CryptoJS from 'crypto-js';
import AES from 'crypto-js/aes';

import { kAssert } from './kAssert';

const ______________K______________ = '______________K______________';

function getter(key: string) {
  const ret = localStorage.getItem(key);

  return AES.decrypt(ret!, ______________K______________).toString(CryptoJS.enc.Utf8);
}

function setter(key: string, value: string) {
  localStorage.setItem(key, AES.encrypt(value, ______________K______________).toString());
}

class GlobalStorage {
  get restApiKey(): string {
    const ret = getter('krk');
    kAssert(ret, 'restApiKey is not set. did you initialize kakao sdk?');

    return ret;
  }

  set restApiKey(value: string) {
    setter('krk', value);
  }
  get javascriptKey(): string {
    const ret = getter('kjk');
    kAssert(ret, 'javascriptKey is not set. did you initialize kakao sdk?');

    return ret;
  }

  set javascriptKey(value: string) {
    setter('kjk', value);
  }

  get accessToken(): string {
    const ret = getter('kat');
    kAssert(ret, 'accessToken is not set. did you login to kakao?');

    return ret;
  }
  set accessToken(value: string) {
    setter('kat', value);
  }

  get headers(): object {
    return {
      Authorization: `Bearer ${this.accessToken}`,
    };
  }
}

export default new GlobalStorage();
