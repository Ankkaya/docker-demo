import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PrinterConfigsService } from './printer-configs.service';
import { CreatePrinterConfigDto, PaperType, PrintMode, PrintOrientation, PrintSpeed, PrintDarkness } from './dto/create-printer-config.dto';
import { UpdatePrinterConfigDto } from './dto/update-printer-config.dto';

@ApiTags('后台接口/打印机配置')
@Controller('printer-configs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PrinterConfigsController {
  constructor(private readonly service: PrinterConfigsService) {}

  @Post()
  @ApiOperation({ summary: '创建打印配置' })
  create(@Body() dto: CreatePrinterConfigDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取打印配置列表' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取打印配置详情' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新打印配置' })
  update(@Param('id') id: string, @Body() dto: UpdatePrinterConfigDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除打印配置' })
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }

  @Get('options/enums')
  @ApiOperation({ summary: '获取打印配置枚举选项' })
  getEnumOptions() {
    return {
      paperTypes: [
        { label: '连续纸', value: PaperType.CONTINUOUS },
        { label: '标签纸', value: PaperType.LABEL },
        { label: '黑标纸', value: PaperType.MARK },
        { label: '穿孔纸', value: PaperType.PERFORATED },
      ],
      printModes: [
        { label: '打印模式', value: PrintMode.PRINT },
        { label: '白色底色图片', value: PrintMode.PREV_BASE64 },
        { label: '透明底色图片', value: PrintMode.TRANS_BASE64 },
        { label: '生成打印数据', value: PrintMode.PRINT_DATA },
      ],
      orientations: [
        { label: '水平方向', value: PrintOrientation.HORIZONTAL },
        { label: '右转90度', value: PrintOrientation.RIGHT_90 },
        { label: '180度旋转', value: PrintOrientation.ROTATE_180 },
        { label: '左转90度', value: PrintOrientation.LEFT_90 },
      ],
      printSpeeds: [
        { label: '随打印机', value: PrintSpeed.PRINTER_DEFAULT },
        { label: '1(特慢)', value: PrintSpeed.SPEED_1 },
        { label: '2(慢)', value: PrintSpeed.SPEED_2 },
        { label: '3(正常)', value: PrintSpeed.SPEED_3 },
        { label: '4(快)', value: PrintSpeed.SPEED_4 },
        { label: '5(特快)', value: PrintSpeed.SPEED_5 },
      ],
      printDarknessLevels: [
        { label: '随打印机', value: PrintDarkness.PRINTER_DEFAULT },
        { label: '6(正常)', value: PrintDarkness.LEVEL_6 },
        { label: '7', value: PrintDarkness.LEVEL_7 },
        { label: '8', value: PrintDarkness.LEVEL_8 },
        { label: '9', value: PrintDarkness.LEVEL_9 },
        { label: '10(较浓)', value: PrintDarkness.LEVEL_10 },
        { label: '11', value: PrintDarkness.LEVEL_11 },
        { label: '12', value: PrintDarkness.LEVEL_12 },
        { label: '13', value: PrintDarkness.LEVEL_13 },
        { label: '14', value: PrintDarkness.LEVEL_14 },
        { label: '15(特浓)', value: PrintDarkness.LEVEL_15 },
      ],
      gapTypes: [
        { label: '随打印机', value: 255 },
        { label: '连续纸', value: 0 },
        { label: '定位孔', value: 1 },
        { label: '间隙纸', value: 2 },
      ],
    };
  }
}
