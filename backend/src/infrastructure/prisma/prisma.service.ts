import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
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
}
