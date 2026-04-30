import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CreateMallRechargeActivityDto } from './dto/create-mall-recharge-activity.dto';
import { QueryMallRechargeActivityDto } from './dto/query-mall-recharge-activity.dto';
import { UpdateMallRechargeActivityDto } from './dto/update-mall-recharge-activity.dto';
import { MallRechargeActivitiesService } from './mall-recharge-activities.service';

@ApiTags('后台接口/充值活动')
@Controller('mall-recharge-activities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MallRechargeActivitiesController {
  constructor(private readonly mallRechargeActivitiesService: MallRechargeActivitiesService) {}

  @Post()
  @ApiOperation({ summary: '创建充值活动' })
  create(@Body() dto: CreateMallRechargeActivityDto) {
    return this.mallRechargeActivitiesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '查询充值活动列表' })
  findAll(@Query() query: QueryMallRechargeActivityDto) {
    return this.mallRechargeActivitiesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询充值活动详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mallRechargeActivitiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新充值活动' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMallRechargeActivityDto) {
    return this.mallRechargeActivitiesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除充值活动' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mallRechargeActivitiesService.remove(id);
  }
}
