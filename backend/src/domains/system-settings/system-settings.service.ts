import { Injectable, OnModuleInit } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { UpsertSystemSettingDto } from './dto/upsert-system-setting.dto';
import { SystemSettingVo } from './vo/system-setting.vo';

export interface MiniProgramAuthSetting {
  wechatAppId: string;
  wechatAppSecret: string;
}

export interface WechatPaySetting {
  mchId: string;
  mchSerialNo: string;
  apiV3Key: string;
  notifyUrl: string;
  refundNotifyUrl: string;
  privateKey: string;
  platformPublicKey: string;
  platformCertPath: string;
}

const DEFAULT_MINI_PROGRAM_AUTH_SETTING: MiniProgramAuthSetting = {
  wechatAppId: '',
  wechatAppSecret: '',
};

const DEFAULT_WECHAT_PAY_SETTING: WechatPaySetting = {
  mchId: '',
  mchSerialNo: '',
  apiV3Key: '',
  notifyUrl: '',
  refundNotifyUrl: '',
  privateKey: '',
  platformPublicKey: '',
  platformCertPath: '',
};

const SECRET_MASK = '********';
const ENCRYPTED_PREFIX = 'enc:v1:';

@Injectable()
export class SystemSettingsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    const settings = await this.prisma.systemSetting.findMany();
    for (const setting of settings) {
      const encryptedValue = this.transformSecrets(
        setting.value || {},
        value => this.encryptSecret(value),
      );
      if (JSON.stringify(encryptedValue) !== JSON.stringify(setting.value)) {
        await this.prisma.systemSetting.update({
          where: { id: setting.id },
          data: { value: encryptedValue },
        });
      }
    }
  }

  async findAll() {
    const list = await this.prisma.systemSetting.findMany({
      orderBy: [{ category: 'asc' }, { id: 'asc' }],
    });
    return list.map(item => this.toPublicVo(item));
  }

  async findByCategory(category: string) {
    const list = await this.prisma.systemSetting.findMany({
      where: { category },
      orderBy: { id: 'asc' },
    });
    return list.map(item => this.toPublicVo(item));
  }

  async getRawByKey(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key } });
    if (!setting) {
      return null;
    }

    return {
      ...setting,
      value: this.transformSecrets(setting.value, value => this.decryptSecret(value)),
    };
  }

  async upsert(dto: UpsertSystemSettingDto) {
    const existing = await this.getRawByKey(dto.key);
    const mergedValue = this.mergeMaskedSecrets(
      dto.value,
      (existing?.value || {}) as Record<string, any>,
    );
    const encryptedValue = this.transformSecrets(
      mergedValue,
      value => this.encryptSecret(value),
    );

    const saved = await this.prisma.systemSetting.upsert({
      where: { key: dto.key },
      update: {
        category: dto.category,
        name: dto.name,
        value: encryptedValue,
        description: dto.description?.trim() || null,
      },
      create: {
        key: dto.key,
        category: dto.category,
        name: dto.name,
        value: encryptedValue,
        description: dto.description?.trim() || null,
      },
    });

    return this.toPublicVo(saved);
  }

  async getMiniProgramAuthSetting(): Promise<MiniProgramAuthSetting> {
    const setting = await this.getRawByKey('mini-program.auth');
    const value = (setting?.value || {}) as Record<string, any>;

    return {
      wechatAppId: String(value.wechatAppId ?? process.env.WECHAT_APP_ID ?? ''),
      wechatAppSecret: String(value.wechatAppSecret ?? process.env.WECHAT_APP_SECRET ?? ''),
    };
  }

  async getWechatPaySetting(): Promise<WechatPaySetting> {
    const setting = await this.getRawByKey('wechat.pay');
    const value = (setting?.value || {}) as Record<string, any>;

    return {
      mchId: String(value.mchId ?? DEFAULT_WECHAT_PAY_SETTING.mchId),
      mchSerialNo: String(value.mchSerialNo ?? DEFAULT_WECHAT_PAY_SETTING.mchSerialNo),
      apiV3Key: String(value.apiV3Key ?? DEFAULT_WECHAT_PAY_SETTING.apiV3Key),
      notifyUrl: String(value.notifyUrl ?? DEFAULT_WECHAT_PAY_SETTING.notifyUrl),
      refundNotifyUrl: String(value.refundNotifyUrl ?? DEFAULT_WECHAT_PAY_SETTING.refundNotifyUrl),
      privateKey: String(value.privateKey ?? DEFAULT_WECHAT_PAY_SETTING.privateKey),
      platformPublicKey: String(value.platformPublicKey ?? DEFAULT_WECHAT_PAY_SETTING.platformPublicKey),
      platformCertPath: String(value.platformCertPath ?? DEFAULT_WECHAT_PAY_SETTING.platformCertPath),
    };
  }

  private toPublicVo(entity: any): SystemSettingVo {
    const decrypted = this.transformSecrets(
      entity.value || {},
      value => this.decryptSecret(value),
    );
    const masked = this.transformSecrets(
      decrypted,
      value => value ? SECRET_MASK : value,
    );

    return SystemSettingVo.fromEntity({ ...entity, value: masked });
  }

  private transformSecrets(value: any, transform: (value: string) => string): any {
    if (Array.isArray(value)) {
      return value.map(item => this.transformSecrets(item, transform));
    }
    if (!value || typeof value !== 'object') {
      return value;
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        if (this.isSensitiveKey(key) && typeof item === 'string') {
          return [key, transform(item)];
        }
        return [key, this.transformSecrets(item, transform)];
      }),
    );
  }

  private mergeMaskedSecrets(incoming: any, existing: any): any {
    if (Array.isArray(incoming)) {
      return incoming.map((item, index) => this.mergeMaskedSecrets(item, existing?.[index]));
    }
    if (!incoming || typeof incoming !== 'object') {
      return incoming;
    }

    return Object.fromEntries(
      Object.entries(incoming).map(([key, value]) => {
        if (this.isSensitiveKey(key) && value === SECRET_MASK) {
          return [key, existing?.[key] || ''];
        }
        return [key, this.mergeMaskedSecrets(value, existing?.[key])];
      }),
    );
  }

  private isSensitiveKey(key: string): boolean {
    return /(secret|password|token|privatekey|apiv3key)/i.test(key);
  }

  private encryptSecret(value: string): string {
    if (!value || value.startsWith(ENCRYPTED_PREFIX)) {
      return value;
    }

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.getEncryptionKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${ENCRYPTED_PREFIX}${iv.toString('base64')}.${tag.toString('base64')}.${ciphertext.toString('base64')}`;
  }

  private decryptSecret(value: string): string {
    if (!value?.startsWith(ENCRYPTED_PREFIX)) {
      return value;
    }

    const [ivText, tagText, cipherText] = value.slice(ENCRYPTED_PREFIX.length).split('.');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.getEncryptionKey(),
      Buffer.from(ivText, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tagText, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(cipherText, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  private getEncryptionKey(): Buffer {
    const secret = process.env.SYSTEM_SETTINGS_ENCRYPTION_KEY
      || process.env.JWT_SECRET
      || 'development-only-system-settings-key';
    return createHash('sha256').update(secret).digest();
  }
}
