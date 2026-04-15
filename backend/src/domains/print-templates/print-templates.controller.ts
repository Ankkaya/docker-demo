import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PrintTemplatesService } from './print-templates.service';
import { CreatePrintTemplateDto, BizType } from './dto/create-print-template.dto';
import { UpdatePrintTemplateDto } from './dto/update-print-template.dto';

@ApiTags('后台接口/打印模板')
@Controller('print-templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PrintTemplatesController {
  constructor(private readonly service: PrintTemplatesService) {}

  @Post()
  @ApiOperation({ summary: '创建打印模板' })
  create(@Body() dto: CreatePrintTemplateDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取打印模板列表' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取打印模板详情' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新打印模板' })
  update(@Param('id') id: string, @Body() dto: UpdatePrintTemplateDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除打印模板' })
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }

  @Get('options/enums')
  @ApiOperation({ summary: '获取打印模板枚举选项' })
  getEnumOptions() {
    return {
      bizTypes: [
        { label: '销售订单', value: BizType.ORDER },
        { label: '发货单', value: BizType.SHIPMENT },
        { label: '采购单', value: BizType.PURCHASE },
        { label: '商品标签', value: BizType.PRODUCT_LABEL },
      ],
    };
  }
}
