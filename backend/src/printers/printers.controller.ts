import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PrintersService } from './printers.service';
import { CreatePrinterDto } from './dto/create-printer.dto';
import { UpdatePrinterDto } from './dto/update-printer.dto';

@ApiTags('printers')
@Controller('printers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PrintersController {
  constructor(private readonly service: PrintersService) {}

  @Post()
  @ApiOperation({ summary: '创建打印机' })
  create(@Body() dto: CreatePrinterDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取打印机列表' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取打印机详情' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新打印机' })
  update(@Param('id') id: string, @Body() dto: UpdatePrinterDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除打印机' })
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
