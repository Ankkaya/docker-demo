import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CartsService } from './carts.service';
import { AddToCartDto, CreateCartDto, QueryCartDto, UpdateCartDto } from './dto';

@ApiTags('后台接口/购物车管理')
@Controller('carts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminCartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  @ApiOperation({ summary: '获取购物车列表（管理后台）' })
  findAll(@Query() query: QueryCartDto) {
    return this.cartsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取购物车项详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cartsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建购物车项（管理后台）' })
  create(@Body() dto: CreateCartDto) {
    return this.cartsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新购物车项（修改数量/选中状态）' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCartDto,
  ) {
    return this.cartsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除购物车项' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cartsService.remove(id);
  }

  @Delete('batch')
  @ApiOperation({ summary: '批量删除购物车项' })
  removeBatch(@Body('ids') ids: number[]) {
    return this.cartsService.removeBatch(ids);
  }
}

@ApiTags('商城接口/购物车')
@Controller('carts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MallCartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get('my')
  @ApiOperation({ summary: '获取我的购物车' })
  findMyCart(@Request() req) {
    return this.cartsService.findByUserId(req.user.sub);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取购物车统计信息' })
  async getStats(@Request() req) {
    return this.cartsService.findByUserId(req.user.sub);
  }

  @Post('add')
  @ApiOperation({ summary: '添加商品到购物车' })
  addToCart(@Body() dto: AddToCartDto, @Request() req) {
    return this.cartsService.addToCart(req.user.sub, dto);
  }

  @Patch(':id/select')
  @ApiOperation({ summary: '切换购物车项选中状态' })
  toggleSelect(
    @Param('id', ParseIntPipe) id: number,
    @Body('selected') selected: boolean,
  ) {
    return this.cartsService.update(id, { selected });
  }

  @Patch('select-all')
  @ApiOperation({ summary: '全选或取消全选购物车项' })
  async selectAll(
    @Request() req,
    @Body('selected') selected: boolean,
  ) {
    const { list } = await this.cartsService.findByUserId(req.user.sub);
    for (const item of list) {
      await this.cartsService.update(item.id, { selected });
    }
    return this.cartsService.findByUserId(req.user.sub);
  }

  @Delete('clear/my')
  @ApiOperation({ summary: '清空我的购物车' })
  clearMyCart(@Request() req) {
    return this.cartsService.clearByUserId(req.user.sub);
  }
}
