import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireSuperadmin } from '../../src/middleware/require-superadmin';
import { FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin } from '../../src/lib/supabase';
import { requireAuth } from '../../src/middleware/auth.middleware';

vi.mock('../../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

vi.mock('../../src/middleware/auth.middleware', () => ({
  requireAuth: vi.fn(),
}));

describe('requireSuperadmin Middleware', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    mockRequest = {
      user: { id: 'user-123' } as any,
    };
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      sent: false,
    };
    vi.clearAllMocks();
  });

  it('deve retornar 403 se o perfil não for encontrado', async () => {
    (supabaseAdmin.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        }),
      }),
    });

    await requireSuperadmin(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.status).toHaveBeenCalledWith(403);
    expect(mockReply.send).toHaveBeenCalledWith({ error: 'Acesso negado: Perfil não encontrado.' });
  });

  it('deve retornar 403 se platform_role for null', async () => {
    (supabaseAdmin.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { platform_role: null }, error: null }),
        }),
      }),
    });

    await requireSuperadmin(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.status).toHaveBeenCalledWith(403);
    expect(mockReply.send).toHaveBeenCalledWith({ error: 'Acesso negado: Permissão insuficiente.' });
  });

  it('deve retornar 403 se platform_role for tenant_admin', async () => {
    (supabaseAdmin.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { platform_role: 'tenant_admin' }, error: null }),
        }),
      }),
    });

    await requireSuperadmin(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.status).toHaveBeenCalledWith(403);
  });

  it('deve permitir acesso se platform_role for superadmin', async () => {
    (supabaseAdmin.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { platform_role: 'superadmin' }, error: null }),
        }),
      }),
    });

    await requireSuperadmin(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(mockReply.status).not.toHaveBeenCalled();
    expect(mockReply.send).not.toHaveBeenCalled();
  });

  it('deve chamar requireAuth se request.user não existir', async () => {
    mockRequest.user = undefined;
    (requireAuth as any).mockImplementation(async (req: any, rep: any) => {
      rep.sent = true;
      rep.status(401).send({ error: 'Unauthorized' });
    });

    await requireSuperadmin(mockRequest as FastifyRequest, mockReply as FastifyReply);

    expect(requireAuth).toHaveBeenCalled();
  });
});
