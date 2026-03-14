import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { AdjustmentsService } from './adjustments.service';
import { CreateAdjustmentDto, QueryAdjustmentDto } from './dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('后台接口/库存调整')
@Controller('adjustments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdjustmentsController {
  constructor(private readonly adjustmentsService: AdjustmentsService) {}

  @Get()
  @ApiOperation({ summary: '获取调整单列表' })
  findAll(@Query() query: QueryAdjustmentDto) {
    return this.adjustmentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取调整单详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adjustmentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建调整单' })
  create(@Body() dto: CreateAdjustmentDto, @Request() req) {
    return this.adjustmentsService.create(dto, req.user.sub);
  }

  @Patch(':id/audit')
  @ApiOperation({ summary: '审核调整单' })
  audit(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.adjustmentsService.audit(id, req.user.sub);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: '完成调整单' })
  complete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.adjustmentsService.complete(id, req.user.sub);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '取消调整单' })
  cancel(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.adjustmentsService.cancel(id, req.user.sub);
  }
}
