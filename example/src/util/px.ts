import { is } from '@mj-studio/js-util';

export function px(value?: number): `${number}px` {
  if (!is.number(value)) {
    return '0px';
  }

  return `${value}px`;
}
