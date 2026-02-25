import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoriesService } from './inventories.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { QueryInventoryDto, QueryInventoryWarningDto } from './dto/query-inventory.dto';
import { QueryInventoryLogDto } from './dto/query-inventory-log.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@ApiTags('库存管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventories')
export class InventoriesController {
  constructor(private readonly inventoriesService: InventoriesService) {}

  @Get()
  @ApiOperation({ summary: '获取库存列表' })
  findAll(@Query() query: QueryInventoryDto) {
    return this.inventoriesService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取库存汇总统计' })
  getStats(@Query('warehouseId', ParseIntPipe) warehouseId?: number) {
    return this.inventoriesService.getInventoryStats(warehouseId);
  }

  @Get('warnings')
  @ApiOperation({ summary: '获取库存预警列表' })
  findWarnings(@Query() query: QueryInventoryWarningDto) {
    return this.inventoriesService.findWarnings(query);
  }

  @Get('logs/list')
  @ApiOperation({ summary: '获取库存流水列表' })
  findLogs(@Query() query: QueryInventoryLogDto) {
    return this.inventoriesService.findLogs(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取库存详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inventoriesService.findOne(id);
  }

  @Get('sku/:skuId')
  @ApiOperation({ summary: '获取SKU的库存明细' })
  findBySkuId(@Param('skuId', ParseIntPipe) skuId: number) {
    return this.inventoriesService.findBySkuId(skuId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新库存信息（调整库存、安全库存等）' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryDto,
  ) {
    return this.inventoriesService.update(id, dto);
  }

  @Post('initialize')
  @ApiOperation({ summary: '初始化库存（为新SKU创建库存记录）' })
  initializeInventory(
    @Body() dto: {
      skuId: number;
      warehouseId: number;
      quantity: number;
      minStock?: number;
      maxStock?: number;
    },
  ) {
    return this.inventoriesService.initializeInventory(
      dto.skuId,
      dto.warehouseId,
      dto.quantity,
      dto.minStock,
      dto.maxStock,
    );
  }
}
