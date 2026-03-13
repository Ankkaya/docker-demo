import { Injectable, Logger } from '@nestjs/common';
import { MinioService } from '@/minio/minio.service';

@Injectable()
export class IconAssetsService {
  private readonly logger = new Logger('IconAssetsService');
  private readonly iconifyApiBase = (process.env.ICONIFY_API_BASE || 'https://api.iconify.design').replace(/\/+$/, '');
  private readonly legacyIconAliasMap: Record<string, string> = {
    setting: 'material-symbols:settings-outline',
    user: 'material-symbols:person-outline',
    peoples: 'material-symbols:groups-outline',
    menu: 'material-symbols:menu',
    'print-template': 'material-symbols:print-outline',
    printer: 'material-symbols:print-outline',
    'printer-config': 'material-symbols:print-connect-outline',
    database: 'material-symbols:database-outline',
    measurement: 'material-symbols:straighten-outline',
    category: 'material-symbols:category-outline',
    brand: 'material-symbols:bookmark-outline',
    warehouse: 'mdi:warehouse-outline',
    supplier: 'material-symbols:local-shipping-outline',
    customer: 'material-symbols:person-pin-circle-outline',
    shopping: 'material-symbols:shopping-bag-outline',
    goods: 'material-symbols:inventory-2-outline',
    inventory: 'material-symbols:inventory-2-outline',
    'inventory-2': 'material-symbols:inventory-2-outline',
    order: 'material-symbols:receipt-long-outline',
    inbound: 'material-symbols:move-to-inbox-outline',
    return: 'material-symbols:assignment-return-outline',
    shipment: 'material-symbols:local-shipping-outline',
    transfer: 'material-symbols:swap-horiz-outline',
    adjust: 'material-symbols:tune-outline',
    log: 'material-symbols:history-rounded',
    'shopping-cart': 'material-symbols:shopping-cart-outline',
    cart: 'material-symbols:shopping-cart-outline',
    storefront: 'material-symbols:storefront-outline',
    slideshow: 'material-symbols:view-carousel-outline',
  };

  constructor(private readonly minioService: MinioService) {}

  async resolveIconUrl(icon?: string | null): Promise<string | null> {
    const parsed = this.parseIconifyId(icon);
    if (!parsed) {
      return null;
    }

    const objectKey = this.buildObjectKey(parsed.collection, parsed.name);

    if (await this.minioService.fileExists(objectKey)) {
      return this.minioService.getStoredFileProxyUrl(objectKey);
    }

    const svg = await this.fetchIconSvg(parsed.collection, parsed.name);
    if (!svg) {
      return null;
    }

    await this.minioService.uploadBuffer(
      Buffer.from(svg),
      `${parsed.name}.svg`,
      `icons/${parsed.collection}`,
      'image/svg+xml',
    );

    return this.minioService.getStoredFileProxyUrl(objectKey);
  }

  private parseIconifyId(icon?: string | null): { collection: string; name: string } | null {
    if (!icon) {
      return null;
    }

    const trimmed = icon.trim();
    if (!trimmed) {
      return null;
    }

    const normalized = this.normalizeLegacyIcon(trimmed);
    const parts = normalized.split(':');
    if (parts.length !== 2) {
      return null;
    }

    const [collection, name] = parts;
    if (!/^[a-z0-9-]+$/i.test(collection) || !/^[a-z0-9-]+$/i.test(name)) {
      return null;
    }

    return {
      collection: collection.toLowerCase(),
      name: name.toLowerCase(),
    };
  }

  private normalizeLegacyIcon(icon: string): string {
    const lowerCased = icon.toLowerCase();
    if (this.legacyIconAliasMap[lowerCased]) {
      return this.legacyIconAliasMap[lowerCased];
    }

    if (/^[A-Z][A-Za-z0-9]+$/.test(icon)) {
      return `ion:${this.pascalToKebab(icon)}`;
    }

    return icon;
  }

  private pascalToKebab(value: string): string {
    return value
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([A-Z]+)([A-Z][a-z0-9]+)/g, '$1-$2')
      .toLowerCase();
  }

  private buildObjectKey(collection: string, name: string): string {
    return `icons/${collection}/${name}.svg`;
  }

  private async fetchIconSvg(collection: string, name: string): Promise<string | null> {
    const url = `${this.iconifyApiBase}/${collection}/${name}.svg`;

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'image/svg+xml',
        },
      });

      if (!response.ok) {
        this.logger.warn(`获取 Iconify SVG 失败: ${collection}:${name}, status=${response.status}`);
        return null;
      }

      const rawSvg = await response.text();
      return this.normalizeSvg(rawSvg);
    } catch (error) {
      this.logger.warn(`获取 Iconify SVG 异常: ${collection}:${name}, error=${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  private normalizeSvg(svg: string): string {
    let normalized = svg
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/\s(width|height)=["'][^"']*%[^"']*["']/gi, '')
      .trim();

    if (!/\swidth=/.test(normalized)) {
      normalized = normalized.replace('<svg', '<svg width="24"');
    }

    if (!/\sheight=/.test(normalized)) {
      normalized = normalized.replace('<svg', '<svg height="24"');
    }

    return normalized;
  }
}
