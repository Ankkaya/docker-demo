import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import '../load-env';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log('========== 菜单数据检查 ==========\n');

  // 1. 检查所有菜单
  const allMenus = await prisma.menu.findMany({
    orderBy: { id: 'asc' },
  });
  console.log(`1. 数据库中共有 ${allMenus.length} 个菜单：`);
  allMenus.forEach(m => {
    console.log(`   ID: ${m.id}, 名称: ${m.name}, parentId: ${m.parentId || 'null'}, hidden: ${m.hidden}`);
  });

  // 2. 检查 admin 角色
  const adminRole = await prisma.role.findFirst({
    where: { code: 'admin' },
    include: {
      menus: {
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!adminRole) {
    console.log('\n2. 未找到 admin 角色！');
    return;
  }

  console.log(`\n2. Admin 角色 (ID: ${adminRole.id}) 分配了 ${adminRole.menus.length} 个菜单：`);
  adminRole.menus.forEach(m => {
    console.log(`   ID: ${m.id}, 名称: ${m.name}, parentId: ${m.parentId || 'null'}`);
  });

  // 3. 检查缺失的菜单
  const assignedIds = new Set(adminRole.menus.map(m => m.id));
  const missingMenus = allMenus.filter(m => !assignedIds.has(m.id));
  
  if (missingMenus.length > 0) {
    console.log(`\n3. ⚠️  有 ${missingMenus.length} 个菜单未分配给 admin 角色：`);
    missingMenus.forEach(m => {
      console.log(`   ID: ${m.id}, 名称: ${m.name}`);
    });
  } else {
    console.log('\n3. ✅ 所有菜单都已分配给 admin 角色');
  }

  // 4. 检查 parentId 问题
  console.log('\n4. 检查子菜单的父菜单是否都被分配：');
  const childMenus = allMenus.filter(m => m.parentId !== null);
  let hasOrphan = false;
  
  for (const child of childMenus) {
    if (!assignedIds.has(child.parentId!)) {
      console.log(`   ⚠️  菜单 "${child.name}" (ID: ${child.id}) 的父菜单 (ID: ${child.parentId}) 未被分配！`);
      hasOrphan = true;
    }
  }
  
  if (!hasOrphan) {
    console.log('   ✅ 所有子菜单的父菜单都已分配');
  }

  // 5. 模拟 buildTree 过程
  console.log('\n5. 模拟 buildTree 过程：');
  const menuMap = new Map<number, any>();
  const roots: any[] = [];
  
  adminRole.menus.forEach((menu) => {
    menuMap.set(menu.id, { ...menu, children: [] });
  });
  
  const lostMenus: any[] = [];
  
  adminRole.menus.forEach((menu) => {
    const menuNode = menuMap.get(menu.id);
    if (menu.parentId) {
      const parent = menuMap.get(menu.parentId);
      if (parent) {
        parent.children.push(menuNode);
      } else {
        lostMenus.push(menu);
      }
    } else {
      roots.push(menuNode);
    }
  });
  
  if (lostMenus.length > 0) {
    console.log(`   ⚠️  有 ${lostMenus.length} 个菜单会在 buildTree 中丢失：`);
    lostMenus.forEach(m => {
      console.log(`      - ${m.name} (ID: ${m.id}), parentId: ${m.parentId}`);
    });
  } else {
    console.log('   ✅ 所有菜单都能在 buildTree 中正确处理');
  }
  
  console.log(`\n6. 最终树形结构 (${roots.length} 个根菜单)：`);
  roots.forEach(root => {
    console.log(`   - ${root.name} (${root.children.length} 个子菜单)`);
  });

  console.log('\n========== 检查完成 ==========');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
