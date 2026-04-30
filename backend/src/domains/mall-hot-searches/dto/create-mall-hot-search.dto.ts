import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMallHotSearchDto {
  @ApiProperty({
    example: '婴儿连体衣',
    description: '热门搜索词',
  })
  @IsString()
  @MinLength(1)
  keyword: string;

  @ApiPropertyOptional({
    example: 0,
    description: '排序号，数字越小越靠前',
  })
  @IsNumber()
  @IsOptional()
  sort?: number;

  @ApiPropertyOptional({
    example: true,
    description: '是否启用',
  })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}
