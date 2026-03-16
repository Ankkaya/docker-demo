import {
  Body,
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { MallService } from './mall.service';
import { QueryMallProductDto } from './dto/query-mall-product.dto';
import { QueryHotProductDto } from './dto/query-hot-product.dto';
import { QueryMallCategoryDto } from './dto/query-mall-category.dto';
import { WechatLoginDto } from './dto/wechat-login.dto';
import {
  MallHotProductListResponseVo,
  MallProductDetailVo,
  MallProductListResponseVo,
} from './vo/mall.vo';
import { CategoryTreeVo } from '@/categories/vo';
import { BrandVo } from '@/brands/vo';
import { BannerVo } from '@/domains/banners/vo/banner.vo';
import { CartsService } from '@/domains/carts/carts.service';
import { CartListVo } from '@/domains/carts/vo';
import { MallWechatLoginVo } from './vo/mall-auth.vo';
import { ReviewsService } from '@/domains/reviews/reviews.service';
import {
  CreateMallReviewDto,
  QueryMallReviewDto,
} from '@/domains/reviews/dto';
import {
  PendingReviewVo,
  ReviewStatsVo,
  ReviewVo,
} from '@/domains/reviews/vo';

@ApiTags('商城接口/商品')
@ApiExtraModels(MallProductListResponseVo, MallHotProductListResponseVo, MallProductDetailVo)
@Controller('mall')
export class MallProductsController {
  constructor(private readonly mallService: MallService) {}

  @Get('products')
  @ApiOperation({ summary: '获取商城商品列表' })
  @ApiOkResponse({ type: MallProductListResponseVo })
  findProducts(@Query() query: QueryMallProductDto) {
    return this.mallService.findProducts(query);
  }

  @Get('products/hot')
  @ApiOperation({ summary: '获取热门商品列表' })
  @ApiOkResponse({ type: MallHotProductListResponseVo })
  findHotProducts(@Query() query: QueryHotProductDto) {
    return this.mallService.findHotProducts(query);
  }

  @Get('products/:id')
  @ApiOperation({ summary: '获取商品详情（商城展示）' })
  @ApiOkResponse({ type: MallProductDetailVo })
  findProductDetail(@Param('id', ParseIntPipe) id: number) {
    return this.mallService.findProductDetail(id);
  }
}

@ApiTags('商城接口/首页')
@ApiExtraModels(CategoryTreeVo, BrandVo, BannerVo)
@Controller('mall')
export class MallHomeController {
  constructor(private readonly mallService: MallService) {}

  @Get('categories')
  @ApiOperation({ summary: '获取启用的分类列表' })
  @ApiOkResponse({ type: [CategoryTreeVo] })
  findCategories(@Query() query: QueryMallCategoryDto) {
    return this.mallService.findCategories(query);
  }

  @Get('brands')
  @ApiOperation({ summary: '获取启用的品牌列表' })
  @ApiOkResponse({ type: [BrandVo] })
  findBrands() {
    return this.mallService.findBrands();
  }

  @Get('banners')
  @ApiOperation({ summary: '获取启用的轮播图列表' })
  @ApiOkResponse({ type: [BannerVo] })
  findBanners() {
    return this.mallService.findBanners();
  }
}

@ApiTags('商城接口/认证')
@ApiExtraModels(MallWechatLoginVo)
@Controller('mall/auth')
export class MallAuthController {
  constructor(private readonly mallService: MallService) {}

  @Post('wechat-login')
  @ApiOperation({ summary: '微信授权登录' })
  @ApiOkResponse({ type: MallWechatLoginVo })
  wechatLogin(@Body() dto: WechatLoginDto) {
    return this.mallService.wechatLogin(dto);
  }
}

@ApiTags('商城接口/购物车')
@ApiExtraModels(CartListVo)
@Controller('mall/carts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MallCartController {
  constructor(private readonly cartsService: CartsService) {}

  @Get('current')
  @ApiOperation({ summary: '查询当前登录用户购物车' })
  @ApiOkResponse({ type: CartListVo })
  findCurrentUserCart(@Request() req) {
    return this.cartsService.findByUserId(req.user.sub);
  }
}

@ApiTags('商城接口/评价')
@ApiExtraModels(ReviewVo, ReviewStatsVo, PendingReviewVo)
@Controller('mall')
export class MallReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('products/:id/reviews')
  @ApiOperation({ summary: '获取商品评价列表' })
  findProductReviews(
    @Param('id', ParseIntPipe) productId: number,
    @Query() query: QueryMallReviewDto,
  ) {
    return this.reviewsService.findMallProductReviews(productId, query);
  }

  @Get('products/:id/review-stats')
  @ApiOperation({ summary: '获取商品评价统计' })
  getProductReviewStats(@Param('id', ParseIntPipe) productId: number) {
    return this.reviewsService.getProductReviewStats(productId);
  }

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '提交评价' })
  createReview(@Request() req, @Body() dto: CreateMallReviewDto) {
    return this.reviewsService.createMallReview(req.user.sub, dto);
  }

  @Get('reviews/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我的评价' })
  findMyReviews(
    @Request() req,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.reviewsService.findMyReviews(
      req.user.sub,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 10,
    );
  }

  @Get('reviews/pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取待评价订单商品' })
  findPendingReviews(@Request() req) {
    return this.reviewsService.findPendingReviews(req.user.sub);
  }
}
