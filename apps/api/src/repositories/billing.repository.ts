import { supabaseAdmin } from '../lib/supabase';

export class BillingRepository {
  async updateCustomerAsaasId(userId: string, customerId: string) {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ asaas_customer_id: customerId })
      .eq('id', userId);

    if (error) throw new Error(`Failed to update customer id: ${error.message}`);
  }

  async getCustomerAsaasId(userId: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('asaas_customer_id')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.asaas_customer_id || null;
  }

  async createSubscription(data: {
    userId: string;
    providerCustomerId: string;
    providerSubscriptionId: string;
    status: string;
  }) {
    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .insert({
        user_id: data.userId,
        plan_id: 'pro',
        provider: 'asaas',
        provider_customer_id: data.providerCustomerId,
        provider_subscription_id: data.providerSubscriptionId,
        status: data.status,
      });

    if (error) throw new Error(`Failed to create subscription: ${error.message}`);
  }

  async createPayment(data: {
    userId: string;
    providerPaymentId: string;
    amount: number;
    billingType: string;
    status: string;
  }) {
    const { error } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: data.userId,
        provider: 'asaas',
        provider_payment_id: data.providerPaymentId,
        amount: data.amount,
        billing_type: data.billingType,
        status: data.status,
      });

    if (error) throw new Error(`Failed to create payment: ${error.message}`);
  }

  async updateSubscriptionStatusByPayment(paymentId: string, status: string) {
    // Busca o user_id pelo pagamento
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('user_id')
      .eq('provider_payment_id', paymentId)
      .single();

    if (!payment) return;

    // Atualiza status em profiles
    await supabaseAdmin
      .from('profiles')
      .update({ subscription_status: status })
      .eq('id', payment.user_id);

    // Atualiza status na user_subscriptions
    await supabaseAdmin
      .from('user_subscriptions')
      .update({ status: status.toUpperCase() })
      .eq('user_id', payment.user_id)
      .eq('provider', 'asaas');
      
    // Atualiza a tabela payments
    await supabaseAdmin
      .from('payments')
      .update({ status: status.toUpperCase() })
      .eq('provider_payment_id', paymentId);
  }
}

export const billingRepository = new BillingRepository();
