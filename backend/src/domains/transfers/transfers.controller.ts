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
import { TransfersService } from './transfers.service';
import { CreateTransferDto, QueryTransferDto } from './dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('后台接口/库存调拨')
@Controller('transfers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Get()
  @ApiOperation({ summary: '获取调拨单列表' })
  findAll(@Query() query: QueryTransferDto) {
    return this.transfersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取调拨单详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transfersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建调拨单' })
  create(@Body() dto: CreateTransferDto, @Request() req) {
    return this.transfersService.create(dto, req.user.sub);
  }

  @Patch(':id/out')
  @ApiOperation({ summary: '确认出库' })
  confirmOut(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.transfersService.confirmOut(id, req.user.sub);
  }

  @Patch(':id/in')
  @ApiOperation({ summary: '确认入库' })
  confirmIn(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.transfersService.confirmIn(id, req.user.sub);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '取消调拨单' })
  cancel(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.transfersService.cancel(id, req.user.sub);
  }
}
