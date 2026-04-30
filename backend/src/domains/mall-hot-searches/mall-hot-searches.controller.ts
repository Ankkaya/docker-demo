import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CreateMallHotSearchDto } from './dto/create-mall-hot-search.dto';
import { UpdateMallHotSearchDto } from './dto/update-mall-hot-search.dto';
import { MallHotSearchesService } from './mall-hot-searches.service';

@ApiTags('后台接口/商城热门搜索词')
@Controller('mall-hot-searches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MallHotSearchesController {
  constructor(private readonly mallHotSearchesService: MallHotSearchesService) {}

  @Post()
  @ApiOperation({ summary: '创建热门搜索词' })
  create(@Body() dto: CreateMallHotSearchDto) {
    return this.mallHotSearchesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取热门搜索词列表' })
  findAll() {
    return this.mallHotSearchesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取热门搜索词详情' })
  findOne(@Param('id') id: string) {
    return this.mallHotSearchesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新热门搜索词' })
  update(@Param('id') id: string, @Body() dto: UpdateMallHotSearchDto) {
    return this.mallHotSearchesService.update(+id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除热门搜索词' })
  remove(@Param('id') id: string) {
    return this.mallHotSearchesService.remove(+id);
  }
}
