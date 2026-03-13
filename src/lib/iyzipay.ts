import Iyzipay from 'iyzipay';

let _iyzipay: Iyzipay | null = null;

function getIyzipay(): Iyzipay {
  if (!_iyzipay) {
    const apiKey = process.env.IYZICO_API_KEY;
    const secretKey = process.env.IYZICO_SECRET_KEY;

    if (!apiKey || !secretKey) {
      console.error("DEBUG: Iyzico keys missing - API Key:", !!apiKey, "Secret Key:", !!secretKey);
      throw new Error(`Iyzico configuration missing: ${!apiKey ? 'API_KEY ' : ''}${!secretKey ? 'SECRET_KEY' : ''}`);
    }

    _iyzipay = new Iyzipay({
      apiKey,
      secretKey,
      uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
    });
  }
  return _iyzipay;
}

export default getIyzipay;
