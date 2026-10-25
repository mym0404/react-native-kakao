import { kAssert } from '@react-native-kakao/core';

export function validateShippingAddressOptions({
  addressId,
  fromUpdatedAt,
  pageSize,
}: {
  addressId?: number;
  fromUpdatedAt?: number;
  pageSize?: number;
}) {
  if (addressId != null) {
    kAssert(
      Number.isSafeInteger(addressId),
      '[shippingAddresses] addressId must be a safe integer',
    );

    return;
  }

  kAssert(
    fromUpdatedAt == null || (Number.isSafeInteger(fromUpdatedAt) && fromUpdatedAt >= 0),
    '[shippingAddresses] fromUpdatedAt must be a non-negative safe integer in Unix seconds',
  );

  kAssert(
    pageSize == null || (Number.isInteger(pageSize) && pageSize >= 2 && pageSize <= 2147483647),
    '[shippingAddresses] pageSize must be an integer between 2 and 2147483647',
  );
}
