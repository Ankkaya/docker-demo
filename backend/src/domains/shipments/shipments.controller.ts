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
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto, ConfirmShipmentDto } from './dto/create-shipment.dto';
import { QueryShipmentDto } from './dto/query-shipment.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('后台接口/发货管理')
@Controller('shipments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @ApiOperation({ summary: '创建发货单（不指定仓库）' })
  create(@Body() createDto: CreateShipmentDto, @Req() req: any) {
    return this.shipmentsService.create(createDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: '查询发货单列表' })
  findAll(@Query() query: QueryShipmentDto) {
    return this.shipmentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询发货单详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shipmentsService.findOne(id);
  }

  @Patch(':id/ship')
  @ApiOperation({ summary: '确认发货（指定各商品出库仓库）' })
  ship(
    @Param('id', ParseIntPipe) id: number,
    @Body() confirmDto: ConfirmShipmentDto,
    @Req() req: any,
  ) {
    return this.shipmentsService.ship(id, confirmDto.items, req.user.userId);
  }

  @Patch(':id/receive')
  @ApiOperation({ summary: '确认收货' })
  receive(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.shipmentsService.receive(id, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除发货单' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.shipmentsService.remove(id);
  }
}
