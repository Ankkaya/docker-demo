import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { LogAction } from '@prisma/client';

@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const startAt = Date.now();

    return next.handle().pipe(
      tap(async (responseBody) => {
        const duration = Date.now() - startAt;
        const method = request.method;
        const path = request.route?.path || request.url;

        // 根据 HTTP 方法和路径推断操作类型
        const action = this.inferAction(method);
        const module = this.inferModule(path);

        // 仅记录写操作（POST/PUT/PATCH/DELETE）且非日志/上传/查询类接口
        if (!this.shouldLog(method, path)) {
          return;
        }

        // 提取目标ID（如路径参数）
        const targetId = request.params?.id?.toString();

        try {
          await this.prisma.operationLog.create({
            data: {
              userId: user?.sub ?? user?.userId,
              username: user?.username,
              module,
              action,
              targetId,
              description: `${method} ${request.url}`,
              newValue: this.sanitizeBody(request.body),
              ip: request.ip,
              userAgent: request.headers['user-agent'],
              duration,
            },
          });
        }
        catch (error) {
          // 日志写入失败不应影响主业务
          console.error('[OperationLog] 写入失败:', error);
        }
      }),
    );
  }

  private inferAction(method: string): LogAction {
    switch (method) {
      case 'POST':
        return LogAction.CREATE;
      case 'PUT':
      case 'PATCH':
        return LogAction.UPDATE;
      case 'DELETE':
        return LogAction.DELETE;
      default:
        return LogAction.OTHER;
    }
  }

  private inferModule(path: string): string {
    // 从路径前缀推断模块，如 /products → product
    const segments = path.replace('/api/', '/').split('/').filter(Boolean);
    const raw = segments[0] || 'unknown';
    // 去尾部的 s，如 products → product
    return raw.endsWith('s') ? raw.slice(0, -1) : raw;
  }

  private shouldLog(method: string, path: string): boolean {
    // 跳过 GET、OPTIONS、HEAD
    if (['GET', 'OPTIONS', 'HEAD'].includes(method)) {
      return false;
    }
    // 跳过认证、文件、日志、健康检查等接口
    const skipPatterns = [
      /^\/?auth\//,
      /^\/?files\//,
      /^\/?system-logs\//,
      /^\/?upload-records\//,
      /^\/?health/,
      /^\/?public-key/,
    ];
    if (skipPatterns.some(p => p.test(path))) {
      return false;
    }
    return true;
  }

  private sanitizeBody(body: any): any {
    if (Array.isArray(body)) {
      return body.map(item => this.sanitizeBody(item));
    }
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitive = ['password', 'token', 'secret', 'privatekey', 'apiv3key', 'creditcard', 'idcard'];
    return Object.fromEntries(
      Object.entries(body).map(([key, value]) => {
        const normalizedKey = key.toLowerCase();
        if (sensitive.some(item => normalizedKey.includes(item))) {
          return [key, '***'];
        }
        return [key, this.sanitizeBody(value)];
      }),
    );
  }
}
