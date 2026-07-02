import { asaasService } from './asaas.service';
import { billingRepository } from '../repositories/billing.repository';

export class SubscriptionService {
  private async getOrCreateCustomer(userId: string, email: string, name: string, cpfCnpj: string): Promise<string> {
    let customerId = await billingRepository.getCustomerAsaasId(userId);

    if (!customerId) {
      const customer = await asaasService.createCustomer(name, email, cpfCnpj);
      customerId = customer.id;
      await billingRepository.updateCustomerAsaasId(userId, customerId);
    }

    return customerId;
  }

  async createCreditCardSubscription(
    userId: string, 
    email: string, 
    name: string, 
    cpfCnpj: string, 
    creditCardToken: string
  ) {
    const customerId = await this.getOrCreateCustomer(userId, email, name, cpfCnpj);
    const subscription = await asaasService.createCreditCardSubscription(customerId, creditCardToken, 98.77);

    await billingRepository.createSubscription({
      userId,
      providerCustomerId: customerId,
      providerSubscriptionId: subscription.id,
      status: subscription.status,
    });

    return subscription;
  }

  async createPixPayment(
    userId: string, 
    email: string, 
    name: string, 
    cpfCnpj: string
  ) {
    const customerId = await this.getOrCreateCustomer(userId, email, name, cpfCnpj);
    
    // Vencimento amanhã
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    
    const { paymentId, qrCode } = await asaasService.createPixPayment(
      customerId, 
      98.77, 
      dueDate.toISOString().split('T')[0]
    );

    await billingRepository.createPayment({
      userId,
      providerPaymentId: paymentId,
      amount: 98.77,
      billingType: 'PIX',
      status: 'PENDING',
    });

    return { paymentId, qrCode };
  }

  async handleWebhookPaymentConfirmed(paymentId: string) {
    await billingRepository.updateSubscriptionStatusByPayment(paymentId, 'active');
  }
}

export const subscriptionService = new SubscriptionService();
