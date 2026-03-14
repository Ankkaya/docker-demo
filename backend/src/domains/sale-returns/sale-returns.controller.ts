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
import { SaleReturnsService } from './sale-returns.service';
import { CreateSaleReturnDto } from './dto/create-sale-return.dto';
import { UpdateSaleReturnDto } from './dto/update-sale-return.dto';
import { QuerySaleReturnDto } from './dto/query-sale-return.dto';
import { AuditSaleReturnDto } from './dto/audit-sale-return.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('后台接口/销售退货')
@Controller('sale-returns')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SaleReturnsController {
  constructor(private readonly returnsService: SaleReturnsService) {}

  @Post()
  @ApiOperation({ summary: '创建销售退货单' })
  create(@Body() createDto: CreateSaleReturnDto, @Req() req: any) {
    return this.returnsService.create(createDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: '查询销售退货单列表' })
  findAll(@Query() query: QuerySaleReturnDto) {
    return this.returnsService.findAll(query);
  }

  @Get('shipments/returnable')
  @ApiOperation({ summary: '获取可退货的发货单列表' })
  getReturnableShipments(@Query('customerId') customerId?: string) {
    return this.returnsService.getReturnableShipments(
      customerId ? parseInt(customerId, 10) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '查询销售退货单详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.returnsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新销售退货单' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSaleReturnDto,
  ) {
    return this.returnsService.update(id, updateDto);
  }

  @Patch(':id/audit')
  @ApiOperation({ summary: '审核销售退货单' })
  audit(
    @Param('id', ParseIntPipe) id: number,
    @Body() auditDto: AuditSaleReturnDto,
    @Req() req: any,
  ) {
    return this.returnsService.audit(id, auditDto, req.user.userId);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: '完成销售退货单' })
  complete(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.returnsService.complete(id, req.user.userId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '取消销售退货单' })
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.returnsService.cancel(id, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除销售退货单' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.returnsService.remove(id);
  }
}
