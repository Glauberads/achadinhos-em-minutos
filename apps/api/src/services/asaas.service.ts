export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  value: number;
  nextDueDate: string;
  status: string;
}

export interface AsaasPixPayment {
  id: string;
  invoiceUrl: string;
  payload: string; // Copia e cola
  encodedImage: string; // QR code base64
}

export class AsaasService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly mode: string;

  constructor() {
    this.mode = process.env.ASAAS_MODE || 'mock';
    this.apiKey = process.env.ASAAS_API_KEY || '';
    
    if (this.mode === 'production') {
      this.baseUrl = 'https://api.asaas.com/v3';
    } else {
      this.baseUrl = 'https://sandbox.asaas.com/api/v3';
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (this.mode === 'mock') {
      return this.mockResponse(endpoint, options) as any;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Asaas API Error [${endpoint}]:`, errorText);
      throw new Error(`Asaas API Error: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  private mockResponse(endpoint: string, options: RequestInit) {
    if (endpoint.includes('/customers')) {
      return { id: `cus_mock_${Date.now()}` };
    }
    if (endpoint.includes('/subscriptions')) {
      return { id: `sub_mock_${Date.now()}`, status: 'ACTIVE' };
    }
    if (endpoint.includes('/payments') && endpoint.includes('pixQrCode')) {
      return {
        encodedImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        payload: '00020126580014br.gov.bcb.pix0136mock-pix-copia-e-cola-123',
      };
    }
    if (endpoint.includes('/payments')) {
      return { id: `pay_mock_${Date.now()}`, status: 'PENDING' };
    }
    return {};
  }

  async createCustomer(name: string, email: string, cpfCnpj: string): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>('/customers', {
      method: 'POST',
      body: JSON.stringify({ name, email, cpfCnpj }),
    });
  }

  async createCreditCardSubscription(
    customerId: string, 
    creditCardToken: string, 
    value: number
  ): Promise<AsaasSubscription> {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return this.request<AsaasSubscription>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        customer: customerId,
        billingType: 'CREDIT_CARD',
        value,
        nextDueDate: nextMonth.toISOString().split('T')[0],
        creditCardToken,
        cycle: 'MONTHLY'
      }),
    });
  }

  async createPixPayment(customerId: string, value: number, dueDate: string) {
    const payment = await this.request<{ id: string }>('/payments', {
      method: 'POST',
      body: JSON.stringify({
        customer: customerId,
        billingType: 'PIX',
        value,
        dueDate,
      }),
    });

    const qrCode = await this.request<AsaasPixPayment>(`/payments/${payment.id}/pixQrCode`, {
      method: 'GET'
    });

    return {
      paymentId: payment.id,
      qrCode
    };
  }
}

export const asaasService = new AsaasService();
