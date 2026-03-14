import { IsString, IsNumber, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUnitDto {
  @ApiProperty({
    example: '个',
    description: '单位名称，如：个、件、箱、kg',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    example: 'GE',
    description: '单位编码，唯一标识',
  })
  @IsString()
  @MinLength(1)
  code: string;

  @ApiPropertyOptional({
    example: 0,
    description: '排序号，数字越小越靠前',
  })
  @IsNumber()
  @IsOptional()
  sort?: number;
}
