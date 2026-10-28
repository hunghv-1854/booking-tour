export type VnpayParams = Record<string, string>;

export interface VnpayOrder {
  txnRef: string;
  amount: number;
  orderInfo: string;
  ipAddr: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface VnpayConfig {
  tmnCode: string;
  hashSecret: string;
  paymentUrl: string;
  returnUrl: string;
}

export interface PaymentLink {
  paymentId: number;
  txnRef: string;
  paymentUrl: string;
  expiresAt: Date;
}

export interface IpnResponse {
  RspCode: string;
  Message: string;
}

export interface PaymentReturnResult {
  success: boolean;
  txnRef: string;
  responseCode: string;
}
