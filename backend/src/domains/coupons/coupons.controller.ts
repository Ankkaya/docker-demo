import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/auth/guards/permission.guard';
import { RequirePermissions } from '@/auth/decorators/require-permissions.decorator';
import { CouponsService } from './coupons.service';
import { CreateCouponExchangeCodesDto } from './dto/create-coupon-exchange-codes.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { IssueCouponDto } from './dto/issue-coupon.dto';
import { QueryCouponReceiveDto } from './dto/query-coupon-receive.dto';
import { QueryCouponDto } from './dto/query-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@ApiTags('后台接口/优惠券管理')
@Controller('coupons')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermissions('promotion:coupon:create')
  @ApiOperation({ summary: '创建优惠券模板' })
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取优惠券模板列表' })
  findAll(@Query() query: QueryCouponDto) {
    return this.couponsService.findAll(query);
  }

  @Get('receives')
  @ApiOperation({ summary: '获取优惠券发放记录' })
  findReceives(@Query() query: QueryCouponReceiveDto) {
    return this.couponsService.findReceives(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取优惠券模板详情' })
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(Number(id));
  }

  @Patch(':id')
  @UseGuards(PermissionGuard)
  @RequirePermissions('promotion:coupon:update')
  @ApiOperation({ summary: '更新优惠券模板' })
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(Number(id), dto);
  }

  @Post(':id/issue')
  @UseGuards(PermissionGuard)
  @RequirePermissions('promotion:coupon:send')
  @ApiOperation({ summary: '后台发放优惠券' })
  issue(@Param('id') id: string, @Body() dto: IssueCouponDto) {
    return this.couponsService.issue(Number(id), dto);
  }

  @Post(':id/exchange-codes')
  @UseGuards(PermissionGuard)
  @RequirePermissions('promotion:coupon:exchange-code')
  @ApiOperation({ summary: '生成优惠券兑换码' })
  createExchangeCodes(@Param('id') id: string, @Body() dto: CreateCouponExchangeCodesDto) {
    return this.couponsService.createExchangeCodes(Number(id), dto);
  }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  @RequirePermissions('promotion:coupon:delete')
  @ApiOperation({ summary: '删除优惠券模板' })
  remove(@Param('id') id: string) {
    return this.couponsService.remove(Number(id));
  }
}
