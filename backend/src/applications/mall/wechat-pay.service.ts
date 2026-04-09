import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { createDecipheriv, createSign, createVerify, randomBytes, X509Certificate } from 'crypto';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { SystemSettingsService } from '@/domains/system-settings/system-settings.service';

interface CreateJsapiOrderParams {
  description: string;
  outTradeNo: string;
  amount: number;
  payerOpenId: string;
}

interface WechatPayResponse {
  prepay_id?: string;
  code?: string;
  message?: string;
  trade_state?: string;
  trade_state_desc?: string;
  transaction_id?: string;
  out_trade_no?: string;
  payer?: {
    openid?: string;
  };
}

export interface WechatMiniProgramPayParams {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: 'RSA';
  paySign: string;
}

export interface WechatNotifyHeaders {
  serial?: string;
  nonce?: string;
  signature?: string;
  timestamp?: string;
}

export interface WechatTransactionResource {
  out_trade_no: string;
  transaction_id?: string;
  trade_state?: string;
  trade_type?: string;
  success_time?: string;
  amount?: {
    total?: number;
    payer_total?: number;
    currency?: string;
    payer_currency?: string;
  };
  payer?: {
    openid?: string;
  };
}

@Injectable()
export class WechatPayService {
  private readonly logger = new Logger(WechatPayService.name);

  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  async createMiniProgramOrder(params: CreateJsapiOrderParams) {
    const config = await this.getValidatedConfig();
    const body = {
      appid: config.appId,
      mchid: config.mchId,
      description: params.description.slice(0, 120),
      out_trade_no: params.outTradeNo,
      notify_url: config.notifyUrl,
      amount: {
        total: this.toFen(params.amount),
        currency: 'CNY',
      },
      payer: {
        openid: params.payerOpenId,
      },
    };

    const response = await this.requestWechat<WechatPayResponse>({
      method: 'POST',
      path: '/v3/pay/transactions/jsapi',
      body,
    });

    if (!response.prepay_id) {
      this.logger.error(`微信下单返回缺少 prepay_id: ${JSON.stringify(response)}`);
      throw new BadGatewayException('微信支付下单失败');
    }

    return {
      prepayId: response.prepay_id,
      payParams: this.buildMiniProgramPayParams(config.appId, response.prepay_id, config.privateKey),
    };
  }

  async queryOrder(outTradeNo: string) {
    const config = await this.getValidatedConfig();
    return this.requestWechat<WechatPayResponse>({
      method: 'GET',
      path: `/v3/pay/transactions/out-trade-no/${encodeURIComponent(outTradeNo)}?mchid=${encodeURIComponent(config.mchId)}`,
    });
  }

  async closeOrder(outTradeNo: string) {
    const config = await this.getValidatedConfig();
    await this.requestWechat<Record<string, never>>({
      method: 'POST',
      path: `/v3/pay/transactions/out-trade-no/${encodeURIComponent(outTradeNo)}/close`,
      body: {
        mchid: config.mchId,
      },
    });
  }

  async verifyAndDecryptNotify(rawBody: string, headers: WechatNotifyHeaders): Promise<WechatTransactionResource> {
    const config = await this.getValidatedConfig();

    if (!headers.timestamp || !headers.nonce || !headers.signature) {
      throw new BadRequestException('微信支付回调头缺失');
    }

    const isValid = await this.verifyCallbackSignature(rawBody, headers, config.platformCertPath);
    if (!isValid) {
      throw new BadRequestException('微信支付回调验签失败');
    }

    const payload = JSON.parse(rawBody || '{}') as {
      resource?: {
        associated_data?: string;
        nonce?: string;
        ciphertext?: string;
      };
    };

    if (!payload.resource?.nonce || !payload.resource?.ciphertext) {
      throw new BadRequestException('微信支付回调报文无效');
    }

    const decrypted = this.decryptResource({
      apiV3Key: config.apiV3Key,
      associatedData: payload.resource.associated_data,
      nonce: payload.resource.nonce,
      ciphertext: payload.resource.ciphertext,
    });

    return JSON.parse(decrypted) as WechatTransactionResource;
  }

  async buildClientPayParams(prepayId: string) {
    const config = await this.getValidatedConfig();
    return this.buildMiniProgramPayParams(config.appId, prepayId, config.privateKey);
  }

  private async requestWechat<T>(params: { method: 'GET' | 'POST'; path: string; body?: Record<string, any> }) {
    const config = await this.getValidatedConfig();
    const bodyText = params.body ? JSON.stringify(params.body) : '';
    const nonceStr = this.createNonce();
    const timestamp = String(Math.floor(Date.now() / 1000));
    const message = `${params.method}\n${params.path}\n${timestamp}\n${nonceStr}\n${bodyText}\n`;
    const signature = createSign('RSA-SHA256').update(message).sign(config.privateKey, 'base64');
    const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchId}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${config.mchSerialNo}"`;
    const response = await fetch(`https://api.mch.weixin.qq.com${params.path}`, {
      method: params.method,
      headers: {
        Accept: 'application/json',
        Authorization: authorization,
        'Content-Type': 'application/json',
        'User-Agent': 'docker-demo-mall-pay/1.0',
      },
      body: params.method === 'POST' ? bodyText : undefined,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) as T : {} as T;

    if (!response.ok) {
      this.logger.error(`微信支付请求失败 ${response.status}: ${text}`);
      throw new BadGatewayException('微信支付服务调用失败');
    }

    return data;
  }

  private async getValidatedConfig() {
    const [paySetting, miniProgramSetting] = await Promise.all([
      this.systemSettingsService.getWechatPaySetting(),
      this.systemSettingsService.getMiniProgramAuthSetting(),
    ]);

    if (!paySetting.enabled) {
      throw new BadRequestException('微信支付未启用');
    }

    if (!miniProgramSetting.wechatAppId) {
      throw new InternalServerErrorException('未配置微信小程序 AppID');
    }

    if (!paySetting.mchId || !paySetting.mchSerialNo || !paySetting.apiV3Key || !paySetting.notifyUrl || !paySetting.privateKey || !paySetting.platformCertPath) {
      throw new InternalServerErrorException('微信支付配置不完整');
    }

    if (paySetting.apiV3Key.length !== 32) {
      throw new InternalServerErrorException('APIv3 Key 长度必须为 32 位');
    }

    return {
      ...paySetting,
      appId: miniProgramSetting.wechatAppId,
      privateKey: paySetting.privateKey.replace(/\\n/g, '\n'),
    };
  }

  private buildMiniProgramPayParams(appId: string, prepayId: string, privateKey: string): WechatMiniProgramPayParams {
    const timeStamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = this.createNonce();
    const packageValue = `prepay_id=${prepayId}`;
    const paySign = createSign('RSA-SHA256')
      .update(`${appId}\n${timeStamp}\n${nonceStr}\n${packageValue}\n`)
      .sign(privateKey, 'base64');

    return {
      appId,
      timeStamp,
      nonceStr,
      package: packageValue,
      signType: 'RSA',
      paySign,
    };
  }

  private async verifyCallbackSignature(rawBody: string, headers: WechatNotifyHeaders, platformCertPath: string) {
    const certificateContent = await readFile(this.resolvePath(platformCertPath), 'utf8');
    const certificate = new X509Certificate(certificateContent);
    const message = `${headers.timestamp}\n${headers.nonce}\n${rawBody}\n`;
    return createVerify('RSA-SHA256')
      .update(message)
      .verify(certificate.publicKey, headers.signature!, 'base64');
  }

  private decryptResource(params: { apiV3Key: string; associatedData?: string; nonce: string; ciphertext: string }) {
    const key = Buffer.from(params.apiV3Key, 'utf8');
    const data = Buffer.from(params.ciphertext, 'base64');
    const authTag = data.subarray(data.length - 16);
    const cipherText = data.subarray(0, data.length - 16);
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(params.nonce, 'utf8'));

    decipher.setAuthTag(authTag);
    if (params.associatedData) {
      decipher.setAAD(Buffer.from(params.associatedData, 'utf8'));
    }

    return Buffer.concat([decipher.update(cipherText), decipher.final()]).toString('utf8');
  }

  private resolvePath(filePath: string) {
    return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  }

  private createNonce() {
    return randomBytes(16).toString('hex');
  }

  private toFen(amount: number) {
    return Math.round(Number(amount) * 100);
  }
}
