import { supabaseAdmin } from '../lib/supabase';
import { 
  AIProviderType, 
  AICapability,
  AIProviderAdminResponseDTO,
  AIProviderModelResponseDTO,
  AICapabilityRouteResponseDTO
} from '@achadinhos/shared';
import { aiCryptoService } from '../services/ai-crypto.service';

/**
 * Repository layer for AI Governance.
 * Must only be used by the server (has full access via service_role).
 */
export class AIGovernanceRepository {
  // ==========================================
  // Providers
  // ==========================================
  async getProviders(): Promise<AIProviderAdminResponseDTO[]> {
    const { data, error } = await supabaseAdmin
      .from('ai_providers')
      .select(`
        id, provider_type, display_name, enabled, status, created_at, updated_at,
        ai_provider_credentials(id),
        ai_provider_models(capabilities)
      `)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`DB Error: ${error.message}`);

    return data.map((row: any) => {
      // Aggregate capabilities from all models
      const capabilitiesSet = new Set<AICapability>();
      row.ai_provider_models?.forEach((m: any) => {
        m.capabilities?.forEach((c: AICapability) => capabilitiesSet.add(c));
      });

      return {
        id: row.id,
        providerType: row.provider_type as AIProviderType,
        displayName: row.display_name,
        enabled: row.enabled,
        status: row.status,
        credentialConfigured: Array.isArray(row.ai_provider_credentials) && row.ai_provider_credentials.length > 0,
        capabilities: Array.from(capabilitiesSet),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });
  }

  async getProviderById(id: string): Promise<AIProviderAdminResponseDTO | null> {
    const { data, error } = await supabaseAdmin
      .from('ai_providers')
      .select(`
        id, provider_type, display_name, enabled, status, created_at, updated_at,
        ai_provider_credentials(id),
        ai_provider_models(capabilities)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`DB Error: ${error.message}`);
    }

    const capabilitiesSet = new Set<AICapability>();
    data.ai_provider_models?.forEach((m: any) => {
      m.capabilities?.forEach((c: AICapability) => capabilitiesSet.add(c));
    });

    return {
      id: data.id,
      providerType: data.provider_type as AIProviderType,
      displayName: data.display_name,
      enabled: data.enabled,
      status: data.status,
      credentialConfigured: Array.isArray(data.ai_provider_credentials) && data.ai_provider_credentials.length > 0,
      capabilities: Array.from(capabilitiesSet),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // ==========================================
  // Credentials
  // ==========================================
  async getEncryptedCredential(providerId: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from('ai_provider_credentials')
      .select('encrypted_payload')
      .eq('provider_id', providerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`DB Error: ${error.message}`);
    }

    return data.encrypted_payload;
  }

  async upsertCredential(providerId: string, plaintextKey: string): Promise<void> {
    const encryptedPayload = aiCryptoService.encrypt(plaintextKey);
    
    // Using upsert since provider_id is unique
    const { error } = await supabaseAdmin
      .from('ai_provider_credentials')
      .upsert({
        provider_id: providerId,
        encrypted_payload: encryptedPayload,
        key_version: '1', // Static for now, can evolve if keys rotate
        updated_at: new Date().toISOString()
      }, { onConflict: 'provider_id' });

    if (error) throw new Error(`DB Error: ${error.message}`);
  }

  // ==========================================
  // Models
  // ==========================================
  async getModels(providerId?: string): Promise<AIProviderModelResponseDTO[]> {
    let query = supabaseAdmin
      .from('ai_provider_models')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (providerId) {
      query = query.eq('provider_id', providerId);
    }

    const { data, error } = await query;
    if (error) throw new Error(`DB Error: ${error.message}`);

    return data.map((row: any) => ({
      id: row.id,
      providerId: row.provider_id,
      modelKey: row.model_key,
      displayName: row.display_name,
      capabilities: row.capabilities as AICapability[],
      enabled: row.enabled,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  // ==========================================
  // Routes
  // ==========================================
  async getRoutes(): Promise<AICapabilityRouteResponseDTO[]> {
    const { data, error } = await supabaseAdmin
      .from('ai_capability_routes')
      .select('*')
      .order('capability', { ascending: true });

    if (error) throw new Error(`DB Error: ${error.message}`);

    return data.map((row: any) => ({
      capability: row.capability as AICapability,
      primaryProviderId: row.primary_provider_id,
      primaryModelId: row.primary_model_id,
      fallbackProviderId: row.fallback_provider_id,
      fallbackModelId: row.fallback_model_id,
      enabled: row.enabled,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getRouteByCapability(capability: AICapability): Promise<AICapabilityRouteResponseDTO | null> {
    const { data, error } = await supabaseAdmin
      .from('ai_capability_routes')
      .select('*')
      .eq('capability', capability)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`DB Error: ${error.message}`);
    }

    return {
      capability: data.capability as AICapability,
      primaryProviderId: data.primary_provider_id,
      primaryModelId: data.primary_model_id,
      fallbackProviderId: data.fallback_provider_id,
      fallbackModelId: data.fallback_model_id,
      enabled: data.enabled,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export const aiGovernanceRepository = new AIGovernanceRepository();
