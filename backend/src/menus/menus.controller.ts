import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('menus')
@Controller('menus')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new menu' })
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menusService.create(createMenuDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all menus (tree structure)' })
  findAll() {
    return this.menusService.findAll();
  }

  @Get('flat')
  @ApiOperation({ summary: 'Get all menus (flat list)' })
  findAllFlat() {
    return this.menusService.findAllFlat();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get menu by ID' })
  findOne(@Param('id') id: string) {
    return this.menusService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update menu' })
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menusService.update(+id, updateMenuDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete menu' })
  remove(@Param('id') id: string) {
    return this.menusService.remove(+id);
  }

  @Get('role/:roleId')
  @ApiOperation({ summary: 'Get menus by role ID' })
  findByRole(@Param('roleId') roleId: string) {
    return this.menusService.findMenusByRoleId(+roleId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get menus by user ID' })
  findByUser(@Param('userId') userId: string) {
    return this.menusService.findMenusByUserId(+userId);
  }
}
