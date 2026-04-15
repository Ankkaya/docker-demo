import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBannerDto {
  @ApiProperty({
    example: '首页春季活动',
    description: '轮播图标题',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({
    example: '新品上市',
    description: '轮播图标签',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  tag?: string;

  @ApiPropertyOptional({
    example: '精选好物限时优惠',
    description: '轮播图子标题',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  subtitle?: string;

  @ApiProperty({
    example: 'banners/1741858352000-banner.png',
    description: '轮播图图片，可为对象键或外链 URL',
  })
  @IsString()
  @MinLength(1)
  image: string;

  @ApiPropertyOptional({
    example: true,
    description: '是否启用跳转',
  })
  @IsBoolean()
  @IsOptional()
  jumpEnabled?: boolean;

  @ApiPropertyOptional({
    example: '/pages/activity/detail?id=1',
    description: '跳转路径，jumpEnabled=true 时建议填写',
  })
  @IsString()
  @IsOptional()
  jumpPath?: string;

  @ApiPropertyOptional({
    example: 0,
    description: '排序号，越小越靠前',
  })
  @IsNumber()
  @IsOptional()
  sort?: number;

  @ApiPropertyOptional({
    example: '首页顶部主轮播',
    description: '备注',
  })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiPropertyOptional({
    example: true,
    description: '是否启用',
  })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}
