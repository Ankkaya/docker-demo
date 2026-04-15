import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PurchaseReceiptsService } from './purchase-receipts.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { QueryReceiptDto } from './dto/query-receipt.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('后台接口/采购入库')
@Controller('purchase-receipts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PurchaseReceiptsController {
  constructor(private readonly receiptsService: PurchaseReceiptsService) {}

  @Get('available-purchases')
  @ApiOperation({ summary: '查询可入库采购订单' })
  getAvailablePurchases(@Query('keyword') keyword?: string) {
    return this.receiptsService.getAvailablePurchases(keyword);
  }

  @Post()
  @ApiOperation({ summary: '创建入库单' })
  create(@Body() createDto: CreateReceiptDto, @Req() req: any) {
    return this.receiptsService.create(createDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: '查询入库单列表' })
  findAll(@Query() query: QueryReceiptDto) {
    return this.receiptsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询入库单详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.receiptsService.findOne(id);
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: '确认入库' })
  confirm(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.receiptsService.confirm(id, req.user.userId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '取消入库单' })
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.receiptsService.cancel(id, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除入库单' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.receiptsService.remove(id);
  }
}
