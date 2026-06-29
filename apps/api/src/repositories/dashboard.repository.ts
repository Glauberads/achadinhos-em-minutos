import { supabaseAdmin } from '../lib/supabase';

export class DashboardRepository {

  /**
   * Executa a RPC get_dashboard_metrics() para obter o payload consolidado do BD.
   * Totalmente otimizado para não sofrer N+1.
   */
  async getMetrics(userId: string): Promise<any> {
    const { data, error } = await supabaseAdmin.rpc('get_dashboard_metrics', {
      p_user_id: userId
    });

    if (error) {
      console.error('[DashboardRepository] Error fetching metrics:', error);
      throw new Error('Failed to fetch dashboard metrics');
    }

    return data;
  }
}

export const dashboardRepository = new DashboardRepository();
