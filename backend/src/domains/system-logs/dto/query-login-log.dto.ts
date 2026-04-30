import { IsOptional, IsInt, IsString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { LoginLogType } from '@prisma/client';

export class QueryLoginLogDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  pageSize?: number = 20;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsEnum(LoginLogType)
  type?: LoginLogType;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;
}
