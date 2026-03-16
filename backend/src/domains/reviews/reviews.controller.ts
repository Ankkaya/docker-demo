import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ReviewsService } from './reviews.service';
import { AuditReviewDto, QueryReviewDto, ReplyReviewDto } from './dto';

@ApiTags('后台接口/评价管理')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: '获取评价列表' })
  findAll(@Query() query: QueryReviewDto) {
    return this.reviewsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取评价详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id/audit')
  @ApiOperation({ summary: '审核评价' })
  audit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AuditReviewDto,
  ) {
    return this.reviewsService.audit(id, dto);
  }

  @Patch(':id/reply')
  @ApiOperation({ summary: '回复评价' })
  reply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplyReviewDto,
  ) {
    return this.reviewsService.reply(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除评价' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.remove(id);
  }
}
