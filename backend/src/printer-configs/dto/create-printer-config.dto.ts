import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

// 纸张类型枚举
export enum PaperType {
  CONTINUOUS = 'CONTINUOUS', // 连续纸 (gapType: 0)
  LABEL = 'LABEL', // 标签纸/间隙纸 (gapType: 2)
  MARK = 'MARK', // 黑标纸/定位孔 (gapType: 1)
  PERFORATED = 'PERFORATED', // 穿孔纸
}

// 打印模式枚举
export enum PrintMode {
  PRINT = 'PRINT', // 打印模式
  PREV_BASE64 = 'PREV_BASE64', // 白色底色图片
  TRANS_BASE64 = 'TRANS_BASE64', // 透明底色图片
  PRINT_DATA = 'PRINT_DATA', // 生成打印数据
}

// 打印方向枚举
export enum PrintOrientation {
  HORIZONTAL = 0, // 水平方向
  RIGHT_90 = 90, // 右转90度
  ROTATE_180 = 180, // 180度旋转
  LEFT_90 = 270, // 左转90度
}

// 打印速度枚举
export enum PrintSpeed {
  PRINTER_DEFAULT = 255, // 随打印机
  SPEED_1 = 0, // 1(特慢)
  SPEED_2 = 1, // 2(慢)
  SPEED_3 = 2, // 3(正常)
  SPEED_4 = 3, // 4(快)
  SPEED_5 = 4, // 5(特快)
}

// 打印浓度枚举
export enum PrintDarkness {
  PRINTER_DEFAULT = 255, // 随打印机
  LEVEL_6 = 5, // 6(正常)
  LEVEL_7 = 6, // 7
  LEVEL_8 = 7, // 8
  LEVEL_9 = 8, // 9
  LEVEL_10 = 9, // 10(较浓)
  LEVEL_11 = 10, // 11
  LEVEL_12 = 11, // 12
  LEVEL_13 = 12, // 13
  LEVEL_14 = 13, // 14
  LEVEL_15 = 14, // 15(特浓)
}

export class CreatePrinterConfigDto {
  @ApiProperty({ example: '销售单默认配置', description: '配置名称' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: 1, description: '模板ID' })
  @IsNumber()
  @IsOptional()
  templateId?: number;

  @ApiPropertyOptional({ example: 1, description: '打印机ID' })
  @IsNumber()
  @IsOptional()
  printerId?: number;

  @ApiPropertyOptional({ example: 1, description: '打印份数' })
  @IsNumber()
  @IsOptional()
  copies?: number;

  @ApiPropertyOptional({ 
    example: 0, 
    description: '打印方向: 0=水平方向, 90=右转90度, 180=180度旋转, 270=左转90度',
    enum: [0, 90, 180, 270]
  })
  @IsNumber()
  @IsOptional()
  orientation?: number;

  @ApiPropertyOptional({ 
    example: 2, 
    description: '纸张间隙类型: 0=连续纸, 1=定位孔, 2=间隙纸, 255=随打印机',
    enum: [0, 1, 2, 255]
  })
  @IsNumber()
  @IsOptional()
  gapType?: number;

  @ApiPropertyOptional({ 
    example: 'LABEL', 
    description: '纸张类型: CONTINUOUS=连续纸, LABEL=标签纸, MARK=黑标纸, PERFORATED=穿孔纸',
    enum: PaperType
  })
  @IsEnum(PaperType)
  @IsOptional()
  paperType?: PaperType;

  @ApiPropertyOptional({ 
    example: 255, 
    description: '打印速度: 255=随打印机, 0=1(特慢), 1=2(慢), 2=3(正常), 3=4(快), 4=5(特快)',
    enum: [255, 0, 1, 2, 3, 4]
  })
  @IsNumber()
  @IsOptional()
  printSpeed?: number;

  @ApiPropertyOptional({ 
    example: 255, 
    description: '打印浓度: 255=随打印机, 5=6(正常), 6=7, 7=8, 8=9, 9=10(较浓), 10=11, 11=12, 12=13, 13=14, 14=15(特浓)',
    enum: [255, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
  })
  @IsNumber()
  @IsOptional()
  printDarkness?: number;

  @ApiPropertyOptional({ 
    example: 'PRINT', 
    description: '打印模式: PRINT=打印模式, PREV_BASE64=白色底色图片, TRANS_BASE64=透明底色图片, PRINT_DATA=生成打印数据',
    enum: PrintMode
  })
  @IsEnum(PrintMode)
  @IsOptional()
  printMode?: PrintMode;

  @ApiPropertyOptional({ example: true, description: '是否默认配置' })
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: true, description: '是否启用' })
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional({ example: '订单打印默认参数', description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}
