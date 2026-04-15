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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('后台接口/收付款管理')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: '创建收付款记录' })
  create(@Body() createDto: CreatePaymentDto, @Req() req: any) {
    return this.paymentsService.create(createDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: '查询收付款列表' })
  findAll(@Query() query: QueryPaymentDto) {
    return this.paymentsService.findAll(query);
  }

  @Get('stats/payable')
  @ApiOperation({ summary: '获取应付款统计' })
  getPayableStats(@Query('supplierId') supplierId?: string) {
    return this.paymentsService.getPayableStats(
      supplierId ? parseInt(supplierId, 10) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '查询收付款详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: '确认收付款' })
  confirm(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.paymentsService.confirm(id, req.user.userId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '取消收付款' })
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.paymentsService.cancel(id, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除收付款记录' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.remove(id);
  }
}
