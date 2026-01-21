import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  // 1. 创建默认管理员角色
  const adminRole = await prisma.role.upsert({
    where: { code: 'admin' },
    update: {},
    create: {
      name: '超级管理员',
      code: 'admin',
      description: '拥有所有权限的超级管理员角色',
    },
  });

  // 2. 创建默认用户角色
  const userRole = await prisma.role.upsert({
    where: { code: 'user' },
    update: {},
    create: {
      name: '普通用户',
      code: 'user',
      description: '普通用户角色',
    },
  });

  // 3. 创建根级菜单
  const systemMenu = await prisma.menu.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: '系统管理',
      path: '/system',
      icon: 'setting',
      component: 'Layout',
      order: 1,
      type: 'menu',
    },
  });

  const userManagementMenu = await prisma.menu.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: '用户管理',
      path: '/system/user',
      icon: 'user',
      component: 'system/user/index',
      parentId: 1,
      order: 1,
      type: 'menu',
    },
  });

  const roleManagementMenu = await prisma.menu.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: '角色管理',
      path: '/system/role',
      icon: 'peoples',
      component: 'system/role/index',
      parentId: 1,
      order: 2,
      type: 'menu',
    },
  });

  const menuManagementMenu = await prisma.menu.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      name: '菜单管理',
      path: '/system/menu',
      icon: 'menu',
      component: 'system/menu/index',
      parentId: 1,
      order: 3,
      type: 'menu',
    },
  });

  // 4. 将所有菜单分配给管理员角色
  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      menus: {
        set: [
          { id: 1 },
          { id: 2 },
          { id: 3 },
          { id: 4 },
        ],
      },
    },
  });

  // 5. 创建默认管理员用户
  const hashedPassword = await bcrypt.hash('123456', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      name: '超级管理员',
      roles: {
        connect: [{ id: adminRole.id }],
      },
    },
  });

  console.log('🌱 Seed data created successfully!');
  console.log('-----------------------------------');
  console.log('Admin User:', {
    id: adminUser.id,
    username: adminUser.username,
    email: adminUser.email,
    name: adminUser.name,
  });
  console.log('-----------------------------------');
  console.log('Admin Role:', {
    id: adminRole.id,
    name: adminRole.name,
    code: adminRole.code,
  });
  console.log('-----------------------------------');
  console.log('Menus:', [systemMenu.name, userManagementMenu.name, roleManagementMenu.name, menuManagementMenu.name]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
