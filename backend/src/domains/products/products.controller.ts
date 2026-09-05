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
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductMallDto } from './dto/update-product-mall.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/auth/guards/permission.guard';
import { RequirePermissions } from '@/auth/decorators/require-permissions.decorator';

@ApiTags('后台接口/商品管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermissions('product:spu:create')
  @ApiOperation({ summary: '创建商品（含SKU）' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: '获取商品列表' })
  findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取商品详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PermissionGuard)
  @RequirePermissions('product:spu:update')
  @ApiOperation({ summary: '更新商品' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Get(':id/mall-info')
  @ApiOperation({ summary: '获取商品商城信息' })
  getMallInfo(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getMallInfo(id);
  }

  @Patch(':id/mall-info')
  @UseGuards(PermissionGuard)
  @RequirePermissions('product:spu:update')
  @ApiOperation({ summary: '更新商品商城信息' })
  updateMallInfo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductMallDto,
  ) {
    return this.productsService.updateMallInfo(id, dto);
  }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  @RequirePermissions('product:spu:delete')
  @ApiOperation({ summary: '删除商品' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  @Get(':id/skus')
  @ApiOperation({ summary: '获取商品的SKU列表' })
  findSkus(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findSkus(id);
  }
}

@ApiTags('后台接口/SKU管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('skus')
export class SkusController {
  constructor(private readonly productsService: ProductsService) {}

  @Patch(':id')
  @UseGuards(PermissionGuard)
  @RequirePermissions('product:sku:update')
  @ApiOperation({ summary: '更新SKU信息' })
  updateSku(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSkuDto,
  ) {
    return this.productsService.updateSku(id, dto);
  }

  @Patch(':id/price')
  @UseGuards(PermissionGuard)
  @RequirePermissions('product:sku:update-price')
  @ApiOperation({ summary: '更新SKU价格' })
  updatePrice(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { costPrice?: number; salePrice?: number; marketPrice?: number },
  ) {
    return this.productsService.updateSkuPrice(id, dto.costPrice, dto.salePrice, dto.marketPrice);
  }
}
