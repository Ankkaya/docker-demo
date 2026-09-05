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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/auth/guards/permission.guard';
import { RequirePermissions } from '@/auth/decorators/require-permissions.decorator';

@ApiTags('后台接口/销售订单')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermissions('sale:order:create')
  @ApiOperation({ summary: '创建销售订单' })
  create(@Body() createDto: CreateOrderDto, @Req() req: any) {
    return this.ordersService.create(createDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: '查询销售订单列表' })
  findAll(@Query() query: QueryOrderDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询销售订单详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PermissionGuard)
  @RequirePermissions('sale:order:update')
  @ApiOperation({ summary: '更新销售订单' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, updateDto);
  }

  @Patch(':id/confirm')
  @UseGuards(PermissionGuard)
  @RequirePermissions('sale:order:confirm')
  @ApiOperation({ summary: '确认销售订单' })
  confirm(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.ordersService.confirm(id, req.user.userId);
  }

  @Patch(':id/cancel')
  @UseGuards(PermissionGuard)
  @RequirePermissions('sale:order:cancel')
  @ApiOperation({ summary: '取消销售订单' })
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.ordersService.cancel(id, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  @RequirePermissions('sale:order:delete')
  @ApiOperation({ summary: '删除销售订单' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.remove(id);
  }
}
