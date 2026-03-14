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
import { PurchaseReturnsService } from './purchase-returns.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';
import { QueryReturnDto } from './dto/query-return.dto';
import { AuditReturnDto } from './dto/audit-return.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('后台接口/采购退货')
@Controller('purchase-returns')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PurchaseReturnsController {
  constructor(private readonly returnsService: PurchaseReturnsService) {}

  @Post()
  @ApiOperation({ summary: '创建退货单' })
  create(@Body() createDto: CreateReturnDto, @Req() req: any) {
    return this.returnsService.create(createDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: '查询退货单列表' })
  findAll(@Query() query: QueryReturnDto) {
    return this.returnsService.findAll(query);
  }

  @Get('receipts/returnable')
  @ApiOperation({ summary: '获取可退货的入库单列表' })
  getReturnableReceipts(@Query('supplierId') supplierId?: string) {
    return this.returnsService.getReturnableReceipts(
      supplierId ? parseInt(supplierId, 10) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '查询退货单详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.returnsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新退货单' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateReturnDto,
  ) {
    return this.returnsService.update(id, updateDto);
  }

  @Patch(':id/audit')
  @ApiOperation({ summary: '审核退货单' })
  audit(
    @Param('id', ParseIntPipe) id: number,
    @Body() auditDto: AuditReturnDto,
    @Req() req: any,
  ) {
    return this.returnsService.audit(id, auditDto, req.user.userId);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: '完成退货单' })
  complete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.returnsService.complete(id, req.user.userId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '取消退货单' })
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.returnsService.cancel(id, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除退货单' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.returnsService.remove(id);
  }
}
