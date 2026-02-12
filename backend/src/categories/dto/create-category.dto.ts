import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    example: '电子产品',
    description: '分类名称',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    example: 'ELEC',
    description: '分类编码，唯一标识',
  })
  @IsString()
  @MinLength(1)
  code: string;

  @ApiPropertyOptional({
    example: 1,
    description: '父级分类ID，为空表示顶级分类',
  })
  @IsNumber()
  @IsOptional()
  parentId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: '层级，1=一级分类，2=二级分类',
  })
  @IsNumber()
  @IsOptional()
  level?: number;

  @ApiPropertyOptional({
    example: 0,
    description: '排序号，数字越小越靠前',
  })
  @IsNumber()
  @IsOptional()
  sort?: number;

  @ApiPropertyOptional({
    example: 'icon-electron',
    description: '分类图标',
  })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/image.jpg',
    description: '分类图片',
  })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({
    example: true,
    description: '是否启用',
  })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}
