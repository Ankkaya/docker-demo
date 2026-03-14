import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaService } from './infrastructure/prisma/prisma.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('========================================');
  logger.log('🚀 应用程序启动中...');
  logger.log('========================================');

  // 打印数据库连接信息（隐藏密码）
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const maskedUrl = dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    logger.log(`📡 数据库地址: ${maskedUrl}`);
  } else {
    logger.warn('⚠️ 未配置 DATABASE_URL 环境变量');
  }

  const app = await NestFactory.create(AppModule);

  // 启用 CORS
  app.enableCors();

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // 全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger 文档配置
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('The API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 获取 PrismaService，确保数据库连接成功
  const prismaService = app.get(PrismaService);
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  logger.log('========================================');
  logger.log('✅ 应用程序启动成功！');
  logger.log('========================================');
  logger.log(`🌐 API 服务地址: http://localhost:${port}`);
  logger.log(`📖 Swagger 文档: http://localhost:${port}/api/docs`);
  logger.log('========================================');
}
bootstrap();
