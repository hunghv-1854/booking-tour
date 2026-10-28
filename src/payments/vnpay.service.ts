import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  VNPAY_AMOUNT_MULTIPLIER,
  VNPAY_COMMAND,
  VNPAY_CURRENCY,
  VNPAY_LOCALE,
  VNPAY_ORDER_TYPE,
  VNPAY_VERSION,
} from './payments.constants';
import { VnpayConfig, VnpayOrder, VnpayParams } from './payments.interface';
import {
  formatVnpayDate,
  signVnpayParams,
  toVnpayQuery,
  verifyVnpaySignature,
} from './vnpay.util';

@Injectable()
export class VnpayService {
  constructor(private readonly configService: ConfigService) {}

  buildPaymentUrl(order: VnpayOrder): string {
    const config = this.config();
    const params: VnpayParams = {
      vnp_Version: VNPAY_VERSION,
      vnp_Command: VNPAY_COMMAND,
      vnp_TmnCode: config.tmnCode,
      vnp_Locale: VNPAY_LOCALE,
      vnp_CurrCode: VNPAY_CURRENCY,
      vnp_TxnRef: order.txnRef,
      vnp_OrderInfo: order.orderInfo,
      vnp_OrderType: VNPAY_ORDER_TYPE,
      vnp_Amount: this.toVnpayAmount(order.amount),
      vnp_ReturnUrl: config.returnUrl,
      vnp_IpAddr: order.ipAddr,
      vnp_CreateDate: formatVnpayDate(order.createdAt),
      vnp_ExpireDate: formatVnpayDate(order.expiresAt),
    };
    const secureHash = signVnpayParams(params, config.hashSecret);
    return `${config.paymentUrl}?${toVnpayQuery(params)}&vnp_SecureHash=${secureHash}`;
  }

  verify(query: VnpayParams): boolean {
    return verifyVnpaySignature(query, this.config().hashSecret);
  }

  toVnpayAmount(amount: number): string {
    return String(Math.round(amount * VNPAY_AMOUNT_MULTIPLIER));
  }

  private config(): VnpayConfig {
    return {
      tmnCode: this.configService.getOrThrow<string>('VNPAY_TMN_CODE'),
      hashSecret: this.configService.getOrThrow<string>('VNPAY_HASH_SECRET'),
      paymentUrl: this.configService.getOrThrow<string>('VNPAY_PAYMENT_URL'),
      returnUrl: this.configService.getOrThrow<string>('VNPAY_RETURN_URL'),
    };
  }
}
