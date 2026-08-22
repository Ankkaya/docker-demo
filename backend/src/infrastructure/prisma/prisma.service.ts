import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (typeof connectionString !== 'string' || connectionString.trim().length === 0) {
      throw new Error('DATABASE_URL 未配置或不是有效字符串，请检查 backend/.env、.env.development 或系统环境变量');
    }

    const pool = new Pool({
      connectionString,
    });
    super({ adapter: new PrismaPg(pool) });
    this.pool = pool;
  }

  async onModuleInit() {
    this.logger.log('正在连接数据库...');
    try {
      await this.$connect();
      this.logger.log('✅ 数据库连接成功');
      
      // 测试连接：执行简单查询
      const result = await this.$queryRaw`SELECT version()`;
      this.logger.log(`📦 PostgreSQL 版本: ${(result as any)[0].version}`);
    } catch (error) {
      this.logger.error('❌ 数据库连接失败:', error.message);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('正在断开数据库连接...');
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('✅ 数据库连接已断开');
  }

  /**
   * 资金、库存状态机使用可串行化事务；遇到 PostgreSQL 写冲突时自动重试。
   */
  async serializableTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    let attempt = 0;
    while (true) {
      try {
        return await this.$transaction(operation, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5_000,
          timeout: 20_000,
        });
      } catch (error: any) {
        attempt += 1;
        if (error?.code !== 'P2034' || attempt >= maxRetries) {
          throw error;
        }
        this.logger.warn(`可串行化事务发生写冲突，正在重试 (${attempt}/${maxRetries})`);
      }
    }
  }
}
