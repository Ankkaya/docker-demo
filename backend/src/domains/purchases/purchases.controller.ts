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
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { QueryPurchaseDto } from './dto/query-purchase.dto';
import { AuditPurchaseDto } from './dto/audit-purchase.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('后台接口/采购订单')
@Controller('purchases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @ApiOperation({ summary: '创建采购订单' })
  create(@Body() createDto: CreatePurchaseDto, @Req() req: any) {
    return this.purchasesService.create(createDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: '查询采购订单列表' })
  findAll(@Query() query: QueryPurchaseDto) {
    return this.purchasesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询采购订单详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchasesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新采购订单' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePurchaseDto,
  ) {
    return this.purchasesService.update(id, updateDto);
  }

  @Patch(':id/audit')
  @ApiOperation({ summary: '审核采购订单' })
  audit(
    @Param('id', ParseIntPipe) id: number,
    @Body() auditDto: AuditPurchaseDto,
    @Req() req: any,
  ) {
    return this.purchasesService.audit(id, auditDto, req.user.userId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '取消采购订单' })
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.purchasesService.cancel(id, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除采购订单' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.purchasesService.remove(id);
  }
}
