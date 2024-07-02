import { Platform } from 'react-native';
import { replaceJsonValuesRecursively } from '@mj-studio/js-util';

export function swapMobileExecutionParamsFieldValueIntoStringInIOS<T extends object>(
  template: T,
): T {
  if (Platform.OS !== 'ios') {
    return template;
  }

  return replaceJsonValuesRecursively(template, {
    replacer: {
      androidExecutionParams: (value: Record<string, string>) =>
        Object.entries(value)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&'),
      iosExecutionParams: (value: Record<string, string>) =>
        Object.entries(value)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&'),
    },
  });
}
