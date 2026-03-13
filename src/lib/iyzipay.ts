import crypto from 'crypto';

export interface IyzicoRequest {
  locale: string;
  conversationId: string;
  price: string;
  paidPrice: string;
  currency: string;
  basketId: string;
  paymentGroup: string;
  callbackUrl: string;
  enabledInstallments: number[];
  buyer: any;
  shippingAddress: any;
  billingAddress: any;
  basketItems: any[];
}

export async function initializeCheckoutForm(request: IyzicoRequest) {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const baseUrl = process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com';

  if (!apiKey || !secretKey) {
    throw new Error('Iyzico API keys are missing in environment variables');
  }

  const rnd = Math.random().toString(36).substring(2, 12);
  const payload = JSON.stringify(request);
  
  // Iyzico V2 Auth Generation
  const hashStr = apiKey + rnd + secretKey + payload;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(hashStr)
    .digest('hex');

  const authorization = Buffer.from(`${apiKey}:${signature}`).toString('base64');

  const response = await fetch(`${baseUrl}/payment/iyzipos/checkoutform/initialize/auth/ecom`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-iyzi-rnd': rnd,
      'Authorization': `IYZWSv2 ${authorization}`,
    },
    body: payload,
  });

  const data = await response.json();

  if (data.status !== 'success') {
    console.error('Iyzico API Error:', data.errorMessage);
    throw new Error(data.errorMessage || 'Iyzico initialization failed');
  }

  return data;
}
