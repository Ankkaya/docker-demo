import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePrinterDto {
  @ApiProperty({ example: '主仓标签打印机', description: '打印机名称' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 'DT60 Label Printer', description: '打印机终端（设备名称）' })
  @IsString()
  @MinLength(1)
  device: string;

  @ApiPropertyOptional({ example: '办公室A区', description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}
