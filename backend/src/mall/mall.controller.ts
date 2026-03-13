import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MallService } from './mall.service';
import { QueryMallProductDto } from './dto/query-mall-product.dto';

@ApiTags('商城前台')
@Controller('mall')
export class MallController {
  constructor(private readonly mallService: MallService) {}

  @Get('products')
  @ApiOperation({ summary: '获取商城商品列表' })
  findProducts(@Query() query: QueryMallProductDto) {
    return this.mallService.findProducts(query);
  }

  @Get('products/:id')
  @ApiOperation({ summary: '获取商品详情（商城展示）' })
  findProductDetail(@Param('id', ParseIntPipe) id: number) {
    return this.mallService.findProductDetail(id);
  }

  @Get('categories')
  @ApiOperation({ summary: '获取启用的分类列表' })
  findCategories() {
    return this.mallService.findCategories();
  }

  @Get('brands')
  @ApiOperation({ summary: '获取启用的品牌列表' })
  findBrands() {
    return this.mallService.findBrands();
  }

  @Get('banners')
  @ApiOperation({ summary: '获取启用的轮播图列表' })
  findBanners() {
    return this.mallService.findBanners();
  }
}
