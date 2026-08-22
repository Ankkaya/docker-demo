import { ExecutionContext, ForbiddenException, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { AuthController } from '@/domains/auth/auth.controller';
import { JwtAuthGuard } from '@/domains/auth/guards/jwt-auth.guard';
import { SystemSettingsService } from '@/domains/system-settings/system-settings.service';
import { OperationLogInterceptor } from '@/common/interceptors/operation-log.interceptor';

describe('security regression', () => {
  afterEach(() => jest.restoreAllMocks());

  it('does not expose a public registration route', () => {
    const routes = Object.getOwnPropertyNames(AuthController.prototype)
      .filter((name) => name !== 'constructor')
      .map((name) => {
        const handler = (AuthController.prototype as any)[name];
        return {
          path: Reflect.getMetadata(PATH_METADATA, handler),
          method: Reflect.getMetadata(METHOD_METADATA, handler),
        };
      });

    expect(routes).not.toContainEqual({ path: 'register', method: RequestMethod.POST });
  });

  it('allows admin role and rejects customer-only role', async () => {
    const parent = Object.getPrototypeOf(JwtAuthGuard.prototype);
    jest.spyOn(parent, 'canActivate').mockResolvedValue(true);
    const guard = new JwtAuthGuard();
    const request: any = { user: { roles: ['admin'] } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    request.user.roles = ['user'];
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('encrypts stored nested secrets, masks public output and decrypts internal output', async () => {
    process.env.SYSTEM_SETTINGS_ENCRYPTION_KEY = 'test-system-settings-encryption-key';
    let stored: any = null;
    const prisma = {
      systemSetting: {
        findUnique: jest.fn(async () => stored),
        upsert: jest.fn(async ({ create, update }: any) => {
          stored = { id: 1, createdAt: new Date(), updatedAt: new Date(), ...(stored ? update : create) };
          return stored;
        }),
      },
    };
    const service = new SystemSettingsService(prisma as any);
    const publicValue = await service.upsert({
      key: 'wechat.pay',
      category: 'wechat',
      name: '微信支付',
      value: { apiV3Key: 'raw-secret', nested: [{ privateKey: 'pem-secret', label: 'safe' }] },
    });

    expect(stored.value.apiV3Key).toMatch(/^enc:v1:/);
    expect(stored.value.nested[0].privateKey).toMatch(/^enc:v1:/);
    expect((publicValue.value as any).apiV3Key).toBe('********');
    expect((publicValue.value as any).nested[0].privateKey).toBe('********');
    const raw = await service.getRawByKey('wechat.pay');
    expect((raw!.value as any).apiV3Key).toBe('raw-secret');
    expect((raw!.value as any).nested[0].privateKey).toBe('pem-secret');
  });

  it('recursively removes sensitive values from audit payloads', () => {
    const interceptor = new OperationLogInterceptor({} as any);
    const sanitized = (interceptor as any).sanitizeBody({
      value: { apiV3Key: 'secret', rows: [{ password: '123456', name: 'ok' }] },
      accessToken: 'token',
    });
    expect(sanitized).toEqual({
      value: { apiV3Key: '***', rows: [{ password: '***', name: 'ok' }] },
      accessToken: '***',
    });
  });
});
