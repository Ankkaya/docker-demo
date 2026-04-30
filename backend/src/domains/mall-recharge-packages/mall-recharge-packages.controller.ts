import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CreateMallRechargePackageDto } from './dto/create-mall-recharge-package.dto';
import { QueryMallRechargePackageDto } from './dto/query-mall-recharge-package.dto';
import { UpdateMallRechargePackageDto } from './dto/update-mall-recharge-package.dto';
import { MallRechargePackagesService } from './mall-recharge-packages.service';
import { MallRechargePackageVo } from './vo/mall-recharge-package.vo';

@ApiTags('充值套餐')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mall-recharge-packages')
export class MallRechargePackagesController {
  constructor(private readonly mallRechargePackagesService: MallRechargePackagesService) {}

  @Post()
  @ApiOperation({ summary: '创建充值套餐' })
  @ApiOkResponse({ type: MallRechargePackageVo })
  create(@Body() dto: CreateMallRechargePackageDto) {
    return this.mallRechargePackagesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取充值套餐列表' })
  findAll(@Query() query: QueryMallRechargePackageDto) {
    return this.mallRechargePackagesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取充值套餐详情' })
  @ApiOkResponse({ type: MallRechargePackageVo })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mallRechargePackagesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新充值套餐' })
  @ApiOkResponse({ type: MallRechargePackageVo })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMallRechargePackageDto) {
    return this.mallRechargePackagesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除充值套餐' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mallRechargePackagesService.remove(id);
  }
}
