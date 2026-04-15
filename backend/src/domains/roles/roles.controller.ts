import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('后台接口/角色管理')
@Controller('roles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: '创建角色' })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: '获取角色列表' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取角色详情' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新角色' })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(+id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(+id);
  }

  // 子资源：角色-菜单
  @Get(':id/menus')
  @ApiQuery({ name: 'format', required: false, enum: ['tree', 'flat'], description: '返回格式：tree-树形(默认), flat-扁平' })
  @ApiOperation({ summary: '获取角色的菜单列表' })
  getRoleMenus(@Param('id') id: string, @Query('format') format?: string) {
    return this.rolesService.getRoleMenus(+id, format);
  }

  @Patch(':id/menus')
  @ApiOperation({ summary: '为角色分配菜单' })
  assignMenus(
    @Param('id') id: string,
    @Body() body: { menuIds: number[] },
  ) {
    return this.rolesService.assignMenus(+id, body.menuIds);
  }
}
