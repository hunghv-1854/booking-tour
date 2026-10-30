import { createHmac } from 'crypto';
import {
  formatVnpayDate,
  signVnpayParams,
  toVnpayQuery,
  verifyVnpaySignature,
} from './vnpay.util';

describe('vnpay.util', () => {
  const secret = 'secret';
  const params = {
    vnp_TxnRef: '12-1',
    vnp_Amount: '100000',
    vnp_OrderInfo: 'Thanh toan booking #12',
  };

  it('sorts keys and encodes spaces as + like the VNPay reference code', () => {
    expect(toVnpayQuery(params)).toBe(
      'vnp_Amount=100000&vnp_OrderInfo=Thanh+toan+booking+%2312&vnp_TxnRef=12-1',
    );
  });

  it('signs the sorted query with HMAC SHA512', () => {
    expect(signVnpayParams(params, secret)).toBe(
      createHmac('sha512', secret)
        .update(
          'vnp_Amount=100000&vnp_OrderInfo=Thanh+toan+booking+%2312&vnp_TxnRef=12-1',
        )
        .digest('hex'),
    );
  });

  it('accepts a valid signature regardless of letter case and hash type', () => {
    const query = {
      ...params,
      vnp_SecureHashType: 'HmacSHA512',
      vnp_SecureHash: signVnpayParams(params, secret).toUpperCase(),
    };
    expect(verifyVnpaySignature(query, secret)).toBe(true);
  });

  it('rejects tampered params, a wrong secret and a missing hash', () => {
    const query = {
      ...params,
      vnp_SecureHash: signVnpayParams(params, secret),
    };
    expect(verifyVnpaySignature({ ...query, vnp_Amount: '1' }, secret)).toBe(
      false,
    );
    expect(verifyVnpaySignature(query, 'other')).toBe(false);
    expect(verifyVnpaySignature(params, secret)).toBe(false);
  });

  it('formats dates as yyyyMMddHHmmss in Vietnam time', () => {
    expect(formatVnpayDate(new Date('2026-10-20T17:05:09Z'))).toBe(
      '20261021000509',
    );
  });
});
