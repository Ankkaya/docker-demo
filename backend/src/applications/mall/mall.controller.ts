import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Query,
  ParseIntPipe,
  Post,
  Req,
  Res,
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
import { MallLoginDto } from './dto/mall-login.dto';
import { MallRefreshTokenDto } from './dto/mall-refresh-token.dto';
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
import { AddToCartDto, UpdateCartDto } from '@/domains/carts/dto';
import { CustomerAddressesService } from '@/domains/customer-addresses/customer-addresses.service';
import { CreateCustomerAddressDto } from '@/domains/customer-addresses/dto/create-customer-address.dto';
import { UpdateCustomerAddressDto } from '@/domains/customer-addresses/dto/update-customer-address.dto';
import { CustomerAddressVo } from '@/domains/customer-addresses/vo/customer-address.vo';
import { MallCurrentUserVo, MallTokenPairVo, MallWechatLoginVo } from './vo/mall-auth.vo';
import { UpdateMallProfileDto } from './dto/update-mall-profile.dto';
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
import { MallOrdersService } from './mall-orders.service';
import { CreateMallOrderDto } from './dto/create-mall-order.dto';
import {
  MallCreateOrderVo,
  MallOrderDetailVo,
  MallOrderListItemVo,
  MallPayOrderVo,
} from './vo/mall-order.vo';
import { PayMallOrderDto } from './dto/pay-mall-order.dto';
import { QueryMallOrderDto } from './dto/query-mall-order.dto';
import { MallBalanceService } from './mall-balance.service';
import { QueryMallBalanceLogDto } from './dto/query-mall-balance-log.dto';
import { CreateMallBalanceRechargeDto } from './dto/create-mall-balance-recharge.dto';
import { MallBalanceLogListVo, MallBalanceRechargeVo, MallBalanceSummaryVo } from './vo/mall-balance.vo';
import { AuthService } from '@/domains/auth/auth.service';
import { FavoritesService } from '@/domains/favorites/favorites.service';
import { BrowseHistoriesService } from '@/domains/browse-histories/browse-histories.service';
import {
  CreateFavoriteDto,
  QueryFavoriteDto,
  QueryFavoriteStatusDto,
} from '@/domains/favorites/dto';
import { FavoriteListVo, FavoriteStatusVo } from '@/domains/favorites/vo';
import {
  CreateBrowseHistoryDto,
  QueryBrowseHistoryDto,
} from '@/domains/browse-histories/dto';
import { BrowseHistoryListVo } from '@/domains/browse-histories/vo';
import { MallCouponsService } from './mall-coupons.service';
import { QueryMallCouponDto } from './dto/query-mall-coupon.dto';
import { MallCouponCenterListVo, MallCouponClaimResultVo, MallCouponSummaryVo, MallCouponWalletListVo } from './vo/mall-coupon.vo';

@ApiTags('商城接口/商品')
@ApiExtraModels(MallProductListResponseVo, MallHotProductListResponseVo, MallProductDetailVo)
@Controller('mall')
export class MallProductsController {
  constructor(
    private readonly mallService: MallService,
    private readonly authService: AuthService,
  ) {}

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
  async findProductDetail(
    @Param('id', ParseIntPipe) id: number,
    @Headers('authorization') authorization?: string,
  ) {
    const userId = await this.tryResolveUserId(authorization);
    return this.mallService.findProductDetail(id, userId);
  }

  private async tryResolveUserId(authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) {
      return undefined;
    }

    try {
      const payload = await this.authService.verifyAccessToken(authorization.slice(7));
      return payload.sub;
    }
    catch {
      return undefined;
    }
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
@ApiExtraModels(MallTokenPairVo, MallWechatLoginVo, MallCurrentUserVo)
@Controller('mall/auth')
export class MallAuthController {
  constructor(private readonly mallService: MallService) {}

  @Post('login')
  @ApiOperation({ summary: '手机号密码登录' })
  @ApiOkResponse({ type: MallTokenPairVo })
  login(@Body() dto: MallLoginDto) {
    return this.mallService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: '刷新登录令牌' })
  @ApiOkResponse({ type: MallTokenPairVo })
  refresh(@Body() dto: MallRefreshTokenDto) {
    return this.mallService.refreshToken(dto);
  }

  @Post('wechat-login')
  @ApiOperation({ summary: '微信授权登录' })
  @ApiOkResponse({ type: MallWechatLoginVo })
  wechatLogin(@Body() dto: WechatLoginDto) {
    return this.mallService.wechatLogin(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前商城登录用户信息' })
  @ApiOkResponse({ type: MallCurrentUserVo })
  getProfile(@Request() req) {
    return this.mallService.getCurrentUser(req.user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新当前商城登录用户资料' })
  @ApiOkResponse({ type: MallCurrentUserVo })
  updateProfile(@Request() req, @Body() dto: UpdateMallProfileDto) {
    return this.mallService.updateMallProfile(req.user.userId, dto);
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

  @Post('add')
  @ApiOperation({ summary: '添加商品到购物车' })
  addToCart(@Request() req, @Body() dto: AddToCartDto) {
    return this.cartsService.addToCart(req.user.sub, dto);
  }

  @Patch('select-all')
  @ApiOperation({ summary: '全选或取消全选购物车项' })
  selectAll(@Request() req, @Body('selected') selected: boolean) {
    return this.cartsService.selectAllByUserId(req.user.sub, selected);
  }

  @Delete('clear')
  @ApiOperation({ summary: '清空当前登录用户购物车' })
  clearCurrentUserCart(@Request() req) {
    return this.cartsService.clearByUserId(req.user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: '修改当前登录用户购物车项' })
  updateCurrentUserCart(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCartDto,
  ) {
    return this.cartsService.updateForUser(req.user.sub, id, dto);
  }

  @Patch(':id/select')
  @ApiOperation({ summary: '切换购物车项选中状态' })
  toggleSelect(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body('selected') selected: boolean,
  ) {
    return this.cartsService.updateForUser(req.user.sub, id, { selected });
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除当前登录用户购物车项' })
  removeCurrentUserCart(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.cartsService.removeForUser(req.user.sub, id);
  }
}

@ApiTags('商城接口/收货地址')
@ApiExtraModels(CustomerAddressVo)
@Controller('mall/addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MallAddressesController {
  constructor(private readonly customerAddressesService: CustomerAddressesService) {}

  @Get()
  @ApiOperation({ summary: '获取当前登录用户收货地址列表' })
  @ApiOkResponse({ type: [CustomerAddressVo] })
  findCurrentUserAddresses(@Request() req) {
    return this.customerAddressesService.findByUserId(req.user.sub);
  }

  @Get('default')
  @ApiOperation({ summary: '获取当前登录用户默认收货地址' })
  @ApiOkResponse({ type: CustomerAddressVo })
  findDefaultAddress(@Request() req) {
    return this.customerAddressesService.findDefaultByUserId(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取当前登录用户收货地址详情' })
  @ApiOkResponse({ type: CustomerAddressVo })
  findCurrentUserAddress(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.customerAddressesService.findOneByUserId(req.user.sub, id);
  }

  @Post()
  @ApiOperation({ summary: '新增当前登录用户收货地址' })
  @ApiOkResponse({ type: CustomerAddressVo })
  createCurrentUserAddress(@Request() req, @Body() dto: CreateCustomerAddressDto) {
    return this.customerAddressesService.createForUser(req.user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新当前登录用户收货地址' })
  @ApiOkResponse({ type: CustomerAddressVo })
  updateCurrentUserAddress(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerAddressDto,
  ) {
    return this.customerAddressesService.updateForUser(req.user.sub, id, dto);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: '设置当前登录用户默认收货地址' })
  @ApiOkResponse({ type: CustomerAddressVo })
  setDefaultAddress(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.customerAddressesService.setDefaultForUser(req.user.sub, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除当前登录用户收货地址' })
  removeCurrentUserAddress(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.customerAddressesService.removeForUser(req.user.sub, id);
  }
}

@ApiTags('商城接口/订单')
@ApiExtraModels(MallCreateOrderVo, MallPayOrderVo, MallOrderListItemVo, MallOrderDetailVo)
@Controller('mall/orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MallOrdersController {
  constructor(private readonly mallOrdersService: MallOrdersService) {}

  @Get()
  @ApiOperation({ summary: '获取我的订单列表' })
  @ApiOkResponse({ type: [MallOrderListItemVo] })
  findOrders(@Request() req, @Query() query: QueryMallOrderDto) {
    return this.mallOrdersService.findAllByUser(req.user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取我的订单详情' })
  @ApiOkResponse({ type: MallOrderDetailVo })
  findOrderDetail(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.mallOrdersService.findOneByUser(req.user.sub, id);
  }

  @Post()
  @ApiOperation({ summary: '创建商城订单' })
  @ApiOkResponse({ type: MallCreateOrderVo })
  createOrder(@Request() req, @Body() dto: CreateMallOrderDto) {
    return this.mallOrdersService.create(req.user.sub, dto);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: '支付商城订单' })
  @ApiOkResponse({ type: MallPayOrderVo })
  payOrder(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PayMallOrderDto,
  ) {
    return this.mallOrdersService.pay(req.user.sub, id, dto);
  }

  @Get(':id/payment-status')
  @ApiOperation({ summary: '查询商城订单支付状态' })
  @ApiOkResponse({ type: MallPayOrderVo })
  getPaymentStatus(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.mallOrdersService.getPaymentStatusByUser(req.user.sub, id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '取消商城订单' })
  @ApiOkResponse({ type: MallOrderDetailVo })
  cancelOrder(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.mallOrdersService.cancel(req.user.sub, id);
  }

  @Patch(':id/receive')
  @ApiOperation({ summary: '确认收货' })
  @ApiOkResponse({ type: MallOrderDetailVo })
  receiveOrder(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.mallOrdersService.receive(req.user.sub, id);
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

@ApiTags('商城接口/余额')
@ApiExtraModels(MallBalanceSummaryVo, MallBalanceLogListVo, MallBalanceRechargeVo)
@Controller('mall/balance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MallBalanceController {
  constructor(private readonly mallBalanceService: MallBalanceService) {}

  @Get()
  @ApiOperation({ summary: '获取我的余额概览' })
  @ApiOkResponse({ type: MallBalanceSummaryVo })
  getSummary(@Request() req) {
    return this.mallBalanceService.getSummaryByUserId(req.user.sub);
  }

  @Get('logs')
  @ApiOperation({ summary: '获取我的余额流水' })
  @ApiOkResponse({ type: MallBalanceLogListVo })
  getLogs(@Request() req, @Query() query: QueryMallBalanceLogDto) {
    return this.mallBalanceService.getLogsByUserId(req.user.sub, query);
  }

  @Post('recharge')
  @ApiOperation({ summary: '创建余额充值' })
  @ApiOkResponse({ type: MallBalanceRechargeVo })
  recharge(@Request() req, @Body() dto: CreateMallBalanceRechargeDto) {
    return this.mallBalanceService.rechargeByUserId(req.user.sub, dto);
  }

  @Get('recharges/:id/status')
  @ApiOperation({ summary: '查询余额充值状态' })
  @ApiOkResponse({ type: MallBalanceRechargeVo })
  getRechargeStatus(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.mallBalanceService.getRechargeStatusByUserId(req.user.sub, id);
  }
}

@ApiTags('商城接口/支付')
@Controller('mall/payments')
export class MallPaymentsController {
  constructor(
    private readonly mallOrdersService: MallOrdersService,
    private readonly mallBalanceService: MallBalanceService,
  ) {}

  @Post('wechat/notify')
  @ApiOperation({ summary: '微信支付回调通知' })
  async wechatNotify(
    @Req() req,
    @Res() res,
    @Headers('wechatpay-serial') serial?: string,
    @Headers('wechatpay-nonce') nonce?: string,
    @Headers('wechatpay-signature') signature?: string,
    @Headers('wechatpay-timestamp') timestamp?: string,
    ) {
    try {
      const rawBody = Buffer.isBuffer(req.rawBody) ? req.rawBody.toString('utf8') : JSON.stringify(req.body || {});
      const orderHandled = await this.mallOrdersService.handleWechatPayNotify(rawBody, {
        serial,
        nonce,
        signature,
        timestamp,
      });
      if (!orderHandled) {
        await this.mallBalanceService.handleWechatPayNotify(rawBody, {
          serial,
          nonce,
          signature,
          timestamp,
        });
      }
      return res.status(200).json({
        code: 'SUCCESS',
        message: '成功',
      });
    } catch (error) {
      return res.status(500).json({
        code: 'FAIL',
        message: error instanceof Error ? error.message : '处理失败',
      });
    }
  }
}

@ApiTags('商城接口/收藏')
@ApiExtraModels(FavoriteListVo, FavoriteStatusVo)
@Controller('mall/favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MallFavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: '获取我的收藏列表' })
  @ApiOkResponse({ type: FavoriteListVo })
  findFavorites(@Request() req, @Query() query: QueryFavoriteDto) {
    return this.favoritesService.findAllByUser(req.user.sub, query);
  }

  @Get('check')
  @ApiOperation({ summary: '批量检查商品收藏状态' })
  @ApiOkResponse({ type: [FavoriteStatusVo] })
  checkFavoriteStatus(@Request() req, @Query() query: QueryFavoriteStatusDto) {
    return this.favoritesService.checkStatus(req.user.sub, query.productIds || []);
  }

  @Post()
  @ApiOperation({ summary: '添加商品收藏' })
  createFavorite(@Request() req, @Body() dto: CreateFavoriteDto) {
    return this.favoritesService.create(req.user.sub, dto);
  }

  @Delete(':productId')
  @ApiOperation({ summary: '取消商品收藏' })
  removeFavorite(@Request() req, @Param('productId', ParseIntPipe) productId: number) {
    return this.favoritesService.remove(req.user.sub, productId);
  }
}

@ApiTags('商城接口/浏览历史')
@ApiExtraModels(BrowseHistoryListVo)
@Controller('mall/histories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MallBrowseHistoriesController {
  constructor(private readonly browseHistoriesService: BrowseHistoriesService) {}

  @Get()
  @ApiOperation({ summary: '获取我的浏览历史' })
  @ApiOkResponse({ type: BrowseHistoryListVo })
  findHistories(@Request() req, @Query() query: QueryBrowseHistoryDto) {
    return this.browseHistoriesService.findAllByUser(req.user.sub, query);
  }

  @Post()
  @ApiOperation({ summary: '记录商品浏览历史' })
  createHistory(@Request() req, @Body() dto: CreateBrowseHistoryDto) {
    return this.browseHistoriesService.record(req.user.sub, dto);
  }

  @Delete('clear')
  @ApiOperation({ summary: '清空浏览历史' })
  clearHistories(@Request() req) {
    return this.browseHistoriesService.clear(req.user.sub);
  }

  @Delete(':productId')
  @ApiOperation({ summary: '删除单条浏览历史' })
  removeHistory(@Request() req, @Param('productId', ParseIntPipe) productId: number) {
    return this.browseHistoriesService.remove(req.user.sub, productId);
  }
}

@ApiTags('商城接口/优惠券')
@ApiExtraModels(MallCouponSummaryVo, MallCouponWalletListVo, MallCouponCenterListVo, MallCouponClaimResultVo)
@Controller('mall/coupons')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MallCouponsController {
  constructor(private readonly mallCouponsService: MallCouponsService) {}

  @Get('summary')
  @ApiOperation({ summary: '获取我的优惠券概览' })
  @ApiOkResponse({ type: MallCouponSummaryVo })
  getSummary(@Request() req) {
    return this.mallCouponsService.getSummaryByUserId(req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: '获取我的优惠券列表' })
  @ApiOkResponse({ type: MallCouponWalletListVo })
  findWallet(@Request() req, @Query() query: QueryMallCouponDto) {
    return this.mallCouponsService.findWalletByUserId(req.user.sub, query);
  }

  @Get('center')
  @ApiOperation({ summary: '获取领券中心列表' })
  @ApiOkResponse({ type: MallCouponCenterListVo })
  findCenter(@Request() req, @Query() query: QueryMallCouponDto) {
    return this.mallCouponsService.findCenterCouponsByUserId(req.user.sub, query);
  }

  @Post(':id/claim')
  @ApiOperation({ summary: '领取优惠券' })
  @ApiOkResponse({ type: MallCouponClaimResultVo })
  claimCoupon(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.mallCouponsService.claimByUserId(req.user.sub, id);
  }
}
