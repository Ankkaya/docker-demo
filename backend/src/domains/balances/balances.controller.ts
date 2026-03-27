import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { BalancesService } from './balances.service';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { CreateBalanceAccountDto } from './dto/create-balance-account.dto';
import { QueryBalanceAccountDto } from './dto/query-balance-account.dto';
import { QueryBalanceLogDto } from './dto/query-balance-log.dto';

@ApiTags('后台接口/余额管理')
@Controller('balances')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Post('accounts')
  @ApiOperation({ summary: '开通余额账户' })
  createAccount(@Body() dto: CreateBalanceAccountDto) {
    return this.balancesService.createAccount(dto);
  }

  @Get('accounts')
  @ApiOperation({ summary: '查询余额账户列表' })
  findAccounts(@Query() query: QueryBalanceAccountDto) {
    return this.balancesService.findAccounts(query);
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: '查询余额账户详情' })
  findAccount(@Param('id', ParseIntPipe) id: number) {
    return this.balancesService.findAccount(id);
  }

  @Post('accounts/:id/adjust')
  @ApiOperation({ summary: '余额调账' })
  adjustAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdjustBalanceDto,
    @Req() req: any,
  ) {
    return this.balancesService.adjustAccount(id, dto, req.user.userId);
  }

  @Get('logs')
  @ApiOperation({ summary: '查询余额流水列表' })
  findLogs(@Query() query: QueryBalanceLogDto) {
    return this.balancesService.findLogs(query);
  }
}
