--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: Warehouse; Type: TABLE DATA; Schema: public; Owner: postgres
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public."Warehouse" DISABLE TRIGGER ALL;

INSERT INTO public."Warehouse" (id, name, code, address, contact, phone, "isDefault", "isEnabled", "createdAt", "updatedAt", "deletedAt") VALUES (1, '主仓库', 'MAIN', '默认仓库地址', '管理员', '', true, true, '2026-03-11 01:52:19.066', '2026-03-11 01:52:19.066', NULL);


ALTER TABLE public."Warehouse" ENABLE TRIGGER ALL;

--
-- Data for Name: Adjustment; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."Adjustment" DISABLE TRIGGER ALL;



ALTER TABLE public."Adjustment" ENABLE TRIGGER ALL;

--
-- Data for Name: Brand; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."Brand" DISABLE TRIGGER ALL;

INSERT INTO public."Brand" (id, name, logo, description, sort, "isEnabled", "createdAt", "updatedAt", "deletedAt") VALUES (1, 'Apple', NULL, '美国苹果公司', 1, true, '2026-03-11 01:52:19.905', '2026-03-11 01:52:19.905', NULL);
INSERT INTO public."Brand" (id, name, logo, description, sort, "isEnabled", "createdAt", "updatedAt", "deletedAt") VALUES (2, '华为', NULL, '华为技术有限公司', 2, true, '2026-03-11 01:52:19.971', '2026-03-11 01:52:19.971', NULL);
INSERT INTO public."Brand" (id, name, logo, description, sort, "isEnabled", "createdAt", "updatedAt", "deletedAt") VALUES (3, 'Mucmukn', 'brands/1773369087423-001e10e10eb6bb58.png', '不可不可', 0, true, '2026-03-13 02:31:33.406', '2026-03-13 02:31:33.406', NULL);


ALTER TABLE public."Brand" ENABLE TRIGGER ALL;

--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."Category" DISABLE TRIGGER ALL;

INSERT INTO public."Category" (id, name, code, "parentId", level, sort, icon, image, "isEnabled", "createdAt", "updatedAt", "deletedAt") VALUES (3, '电脑', 'COMPUTER', 1, 2, 2, NULL, NULL, true, '2026-03-11 01:52:19.722', '2026-03-11 01:52:19.722', NULL);
INSERT INTO public."Category" (id, name, code, "parentId", level, sort, icon, image, "isEnabled", "createdAt", "updatedAt", "deletedAt") VALUES (4, '日用百货', 'DAILY', NULL, 1, 2, NULL, NULL, true, '2026-03-11 01:52:19.806', '2026-03-11 01:52:19.806', NULL);
INSERT INTO public."Category" (id, name, code, "parentId", level, sort, icon, image, "isEnabled", "createdAt", "updatedAt", "deletedAt") VALUES (2, '手机', 'PHONE', 1, 2, 1, '', '', true, '2026-03-11 01:52:19.576', '2026-03-12 02:38:37.29', NULL);
INSERT INTO public."Category" (id, name, code, "parentId", level, sort, icon, image, "isEnabled", "createdAt", "updatedAt", "deletedAt") VALUES (1, '电子产品', 'ELEC', NULL, 1, 1, '', NULL, true, '2026-03-11 01:52:19.455', '2026-03-12 07:17:21.905', NULL);
INSERT INTO public."Category" (id, name, code, "parentId", level, sort, icon, image, "isEnabled", "createdAt", "updatedAt", "deletedAt") VALUES (5, '普通外套', 'ptwt', NULL, 1, 0, 'Accessibility', 'categories/1773369194584-008332032074b7b4.jpg', true, '2026-03-13 02:33:26.529', '2026-03-13 07:51:40.952', NULL);


ALTER TABLE public."Category" ENABLE TRIGGER ALL;

--
-- Data for Name: Unit; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."Unit" DISABLE TRIGGER ALL;

INSERT INTO public."Unit" (id, name, code, sort, "createdAt", "updatedAt", "deletedAt") VALUES (1, '个', 'GE', 1, '2026-03-11 01:52:19.143', '2026-03-11 01:52:19.143', NULL);
INSERT INTO public."Unit" (id, name, code, sort, "createdAt", "updatedAt", "deletedAt") VALUES (2, '件', 'JIAN', 2, '2026-03-11 01:52:19.181', '2026-03-11 01:52:19.181', NULL);
INSERT INTO public."Unit" (id, name, code, sort, "createdAt", "updatedAt", "deletedAt") VALUES (3, '箱', 'XIANG', 3, '2026-03-11 01:52:19.219', '2026-03-11 01:52:19.219', NULL);
INSERT INTO public."Unit" (id, name, code, sort, "createdAt", "updatedAt", "deletedAt") VALUES (4, '千克', 'KG', 4, '2026-03-11 01:52:19.236', '2026-03-11 01:52:19.236', NULL);
INSERT INTO public."Unit" (id, name, code, sort, "createdAt", "updatedAt", "deletedAt") VALUES (5, '克', 'G', 5, '2026-03-11 01:52:19.292', '2026-03-11 01:52:19.292', NULL);
INSERT INTO public."Unit" (id, name, code, sort, "createdAt", "updatedAt", "deletedAt") VALUES (6, '升', 'L', 6, '2026-03-11 01:52:19.346', '2026-03-11 01:52:19.346', NULL);
INSERT INTO public."Unit" (id, name, code, sort, "createdAt", "updatedAt", "deletedAt") VALUES (7, '毫升', 'ML', 7, '2026-03-11 01:52:19.372', '2026-03-11 01:52:19.372', NULL);
INSERT INTO public."Unit" (id, name, code, sort, "createdAt", "updatedAt", "deletedAt") VALUES (8, '米', 'M', 8, '2026-03-11 01:52:19.411', '2026-03-11 01:52:19.411', NULL);


ALTER TABLE public."Unit" ENABLE TRIGGER ALL;

--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."Product" DISABLE TRIGGER ALL;

INSERT INTO public."Product" (id, name, "spuCode", "categoryId", "brandId", description, detail, "mainImage", images, "unitId", "specTemplate", "isEnabled", "createdAt", "updatedAt", "deletedAt", "mallEnabled") VALUES (1, '测试商品', 'SPU2603127977', 2, 1, '商品描述', '<p>商品详情<img src="http://localhost:3001/api/files/preview?filename=editor%2Fassets%2F1773309499579-useless.png" alt="" width="130" height="130"></p>', 'products/main/1773308283946-useless.png', '{products/gallery/1773308859964-used.png}', 2, '[{"name": "尺码", "values": ["80", "90", "100"]}]', true, '2026-03-12 07:21:26.464', '2026-03-12 09:58:28.183', NULL, false);
INSERT INTO public."Product" (id, name, "spuCode", "categoryId", "brandId", description, detail, "mainImage", images, "unitId", "specTemplate", "isEnabled", "createdAt", "updatedAt", "deletedAt", "mallEnabled") VALUES (2, 'Mucmukn【随时运动chill】7A抗菌莱赛尔棉休闲百搭卫衣外套女童春', 'SPU2603138456', 5, 3, '', '<p><img title="00d631648f83aedd.jpg.avif" src="http://localhost:3001/api/files/preview?filename=editor%2Fimages%2F1773389442694-00d631648f83aedd.jpg.avif" alt="00d631648f83aedd.jpg.avif"><img title="00835a0780422ae0.jpg.avif" src="http://localhost:3001/api/files/preview?filename=editor%2Fimages%2F1773389447675-00835a0780422ae0.jpg.avif" alt="00835a0780422ae0.jpg.avif"><img title="0083258320ff2e6d.jpg.avif" src="http://localhost:3001/api/files/preview?filename=editor%2Fimages%2F1773389450910-0083258320ff2e6d.jpg.avif" alt="0083258320ff2e6d.jpg.avif"></p>', 'products/main/1773389428816-008332032067d7a7.jpg.avif', '{products/gallery/1773389432218-00d6316348b38fac.jpg.avif,products/gallery/1773389436704-008332032074b7b4.jpg}', 2, '[{"name": "尺码", "values": ["90", "100"]}, {"name": "颜色", "values": ["红色", "黄色"]}]', true, '2026-03-13 08:11:49.219', '2026-03-13 08:11:49.219', NULL, false);


ALTER TABLE public."Product" ENABLE TRIGGER ALL;

--
-- Data for Name: ProductSku; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."ProductSku" DISABLE TRIGGER ALL;

INSERT INTO public."ProductSku" (id, "skuCode", "productId", specs, "costPrice", "salePrice", "marketPrice", image, barcode, weight, volume, "isDefault", sort, status, "createdAt", "updatedAt", "deletedAt") VALUES (1, 'SKU2603124551', 1, '[{"name": "尺码", "value": "80"}]', 3.00, 6.00, 0.00, NULL, NULL, 0.000, 0.000, true, 0, 'ACTIVE', '2026-03-12 07:21:26.479', '2026-03-12 09:58:28.199', NULL);
INSERT INTO public."ProductSku" (id, "skuCode", "productId", specs, "costPrice", "salePrice", "marketPrice", image, barcode, weight, volume, "isDefault", sort, status, "createdAt", "updatedAt", "deletedAt") VALUES (2, 'SKU2603129488', 1, '[{"name": "尺码", "value": "90"}]', 3.00, 3.00, 0.00, NULL, NULL, 0.000, 0.000, false, 1, 'ACTIVE', '2026-03-12 07:21:26.491', '2026-03-12 09:58:28.204', NULL);
INSERT INTO public."ProductSku" (id, "skuCode", "productId", specs, "costPrice", "salePrice", "marketPrice", image, barcode, weight, volume, "isDefault", sort, status, "createdAt", "updatedAt", "deletedAt") VALUES (3, 'SKU2603124091', 1, '[{"name": "尺码", "value": "100"}]', 3.00, 6.00, 0.00, NULL, NULL, 0.000, 0.000, false, 2, 'ACTIVE', '2026-03-12 07:21:26.494', '2026-03-12 09:58:28.209', NULL);
INSERT INTO public."ProductSku" (id, "skuCode", "productId", specs, "costPrice", "salePrice", "marketPrice", image, barcode, weight, volume, "isDefault", sort, status, "createdAt", "updatedAt", "deletedAt") VALUES (4, 'SKU2603130608', 2, '[{"name": "尺码", "value": "90"}, {"name": "颜色", "value": "红色"}]', 100.00, 200.00, 220.00, NULL, NULL, 0.000, 0.000, true, 0, 'ACTIVE', '2026-03-13 08:11:49.233', '2026-03-13 08:12:56.319', NULL);
INSERT INTO public."ProductSku" (id, "skuCode", "productId", specs, "costPrice", "salePrice", "marketPrice", image, barcode, weight, volume, "isDefault", sort, status, "createdAt", "updatedAt", "deletedAt") VALUES (5, 'SKU2603132279', 2, '[{"name": "尺码", "value": "90"}, {"name": "颜色", "value": "黄色"}]', 100.00, 200.00, 220.00, NULL, NULL, 0.000, 0.000, false, 1, 'ACTIVE', '2026-03-13 08:11:49.243', '2026-03-13 08:12:56.338', NULL);
INSERT INTO public."ProductSku" (id, "skuCode", "productId", specs, "costPrice", "salePrice", "marketPrice", image, barcode, weight, volume, "isDefault", sort, status, "createdAt", "updatedAt", "deletedAt") VALUES (6, 'SKU2603139603', 2, '[{"name": "尺码", "value": "100"}, {"name": "颜色", "value": "红色"}]', 100.00, 200.00, 220.00, NULL, NULL, 0.000, 0.000, false, 2, 'ACTIVE', '2026-03-13 08:11:49.247', '2026-03-13 08:12:56.349', NULL);
INSERT INTO public."ProductSku" (id, "skuCode", "productId", specs, "costPrice", "salePrice", "marketPrice", image, barcode, weight, volume, "isDefault", sort, status, "createdAt", "updatedAt", "deletedAt") VALUES (7, 'SKU2603130542', 2, '[{"name": "尺码", "value": "100"}, {"name": "颜色", "value": "黄色"}]', 100.00, 200.00, 220.00, NULL, NULL, 0.000, 0.000, false, 3, 'ACTIVE', '2026-03-13 08:11:49.25', '2026-03-13 08:12:56.36', NULL);


ALTER TABLE public."ProductSku" ENABLE TRIGGER ALL;

--
-- Data for Name: AdjustmentItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."AdjustmentItem" DISABLE TRIGGER ALL;



ALTER TABLE public."AdjustmentItem" ENABLE TRIGGER ALL;

--
-- Data for Name: Banner; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."Banner" DISABLE TRIGGER ALL;



ALTER TABLE public."Banner" ENABLE TRIGGER ALL;

--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."User" DISABLE TRIGGER ALL;

INSERT INTO public."User" (id, username, email, password, name, "createdAt", "updatedAt", "deletedAt") VALUES (1, 'admin', 'admin@example.com', '$2b$10$7HhnJp6GvpoUzegt.r8g8u0FZnbdqD5ZOMsBwcmqQImcLiRlysgvK', '超级管理员', '2026-03-11 01:52:18.968', '2026-03-11 01:52:18.968', NULL);


ALTER TABLE public."User" ENABLE TRIGGER ALL;

--
-- Data for Name: Cart; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."Cart" DISABLE TRIGGER ALL;



ALTER TABLE public."Cart" ENABLE TRIGGER ALL;

--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."Customer" DISABLE TRIGGER ALL;



ALTER TABLE public."Customer" ENABLE TRIGGER ALL;

--
-- Data for Name: Inventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."Inventory" DISABLE TRIGGER ALL;

INSERT INTO public."Inventory" (id, "skuId", "warehouseId", quantity, locked, available, "minStock", "maxStock", location, "createdAt", "updatedAt") VALUES (1, 4, 1, 1, 0, 1, 0, 999999, NULL, '2026-03-13 08:12:56.313', '2026-03-13 08:12:56.313');
INSERT INTO public."Inventory" (id, "skuId", "warehouseId", quantity, locked, available, "minStock", "maxStock", location, "createdAt", "updatedAt") VALUES (2, 5, 1, 1, 0, 1, 0, 999999, NULL, '2026-03-13 08:12:56.336', '2026-03-13 08:12:56.336');
INSERT INTO public."Inventory" (id, "skuId", "warehouseId", quantity, locked, available, "minStock", "maxStock", location, "createdAt", "updatedAt") VALUES (3, 6, 1, 1, 0, 1, 0, 999999, NULL, '2026-03-13 08:12:56.347', '2026-03-13 08:12:56.347');
INSERT INTO public."Inventory" (id, "skuId", "warehouseId", quantity, locked, available, "minStock", "maxStock", location, "createdAt", "updatedAt") VALUES (4, 7, 1, 1, 0, 1, 0, 999999, NULL, '2026-03-13 08:12:56.358', '2026-03-13 08:12:56.358');


ALTER TABLE public."Inventory" ENABLE TRIGGER ALL;

--
-- Data for Name: InventoryLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."InventoryLog" DISABLE TRIGGER ALL;

INSERT INTO public."InventoryLog" (id, type, "skuId", "warehouseId", quantity, before, after, "bizType", "bizId", "bizNo", remark, "createdBy", "createdAt") VALUES (1, 'IN_PURCHASE', 4, 1, 1, 0, 1, 'PURCHASE', 1, 'RK202603138934', '采购入库: 示例供应商', 1, '2026-03-13 08:12:56.322');
INSERT INTO public."InventoryLog" (id, type, "skuId", "warehouseId", quantity, before, after, "bizType", "bizId", "bizNo", remark, "createdBy", "createdAt") VALUES (2, 'IN_PURCHASE', 5, 1, 1, 0, 1, 'PURCHASE', 1, 'RK202603138934', '采购入库: 示例供应商', 1, '2026-03-13 08:12:56.34');
INSERT INTO public."InventoryLog" (id, type, "skuId", "warehouseId", quantity, before, after, "bizType", "bizId", "bizNo", remark, "createdBy", "createdAt") VALUES (3, 'IN_PURCHASE', 6, 1, 1, 0, 1, 'PURCHASE', 1, 'RK202603138934', '采购入库: 示例供应商', 1, '2026-03-13 08:12:56.352');
INSERT INTO public."InventoryLog" (id, type, "skuId", "warehouseId", quantity, before, after, "bizType", "bizId", "bizNo", remark, "createdBy", "createdAt") VALUES (4, 'IN_PURCHASE', 7, 1, 1, 0, 1, 'PURCHASE', 1, 'RK202603138934', '采购入库: 示例供应商', 1, '2026-03-13 08:12:56.361');


ALTER TABLE public."InventoryLog" ENABLE TRIGGER ALL;

--
-- Data for Name: Menu; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."Menu" DISABLE TRIGGER ALL;

INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (5, '打印模板', '/system/print-templates', 'print-template', 'print-templates/index', NULL, 1, 4, false, false, 'menu', '2026-03-11 01:52:15.181', '2026-03-11 01:52:15.181', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (6, '打印机管理', '/system/printers', 'printer', 'printers/index', NULL, 1, 5, false, false, 'menu', '2026-03-11 01:52:15.223', '2026-03-11 01:52:15.223', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (7, '打印机配置', '/system/printer-configs', 'printer-config', 'printer-configs/index', NULL, 1, 6, false, false, 'menu', '2026-03-11 01:52:15.264', '2026-03-11 01:52:15.264', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (10, '基础数据', '/basic', 'database', 'Layout', NULL, NULL, 2, false, false, 'menu', '2026-03-11 01:52:15.316', '2026-03-11 01:52:15.316', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (11, '计量单位', '/basic/units', 'measurement', 'basic/unit/index', NULL, 10, 1, false, false, 'menu', '2026-03-11 01:52:15.367', '2026-03-11 01:52:15.367', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (12, '商品分类', '/basic/categories', 'category', 'basic/category/index', NULL, 10, 2, false, false, 'menu', '2026-03-11 01:52:15.399', '2026-03-11 01:52:15.399', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (13, '品牌管理', '/basic/brands', 'brand', 'basic/brand/index', NULL, 10, 3, false, false, 'menu', '2026-03-11 01:52:15.423', '2026-03-11 01:52:15.423', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (14, '仓库管理', '/basic/warehouses', 'warehouse', 'basic/warehouse/index', NULL, 10, 4, false, false, 'menu', '2026-03-11 01:52:15.452', '2026-03-11 01:52:15.452', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (15, '供应商管理', '/basic/suppliers', 'supplier', 'basic/supplier/index', NULL, 10, 5, false, false, 'menu', '2026-03-11 01:52:15.489', '2026-03-11 01:52:15.489', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (16, '客户管理', '/basic/customers', 'customer', 'basic/customer/index', NULL, 10, 6, false, false, 'menu', '2026-03-11 01:52:16.129', '2026-03-11 01:52:16.129', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (30, '进销存', '/inventory-mgmt', 'inventory-2', 'Layout', NULL, NULL, 4, false, false, 'menu', '2026-03-11 01:52:17.321', '2026-03-11 01:52:17.321', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (40, '商城管理', '/mall', 'shopping-cart', 'Layout', NULL, NULL, 5, false, false, 'menu', '2026-03-11 01:52:18.711', '2026-03-11 01:52:18.711', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (1, '系统管理', '/system', 'setting', 'Layout', NULL, NULL, 1, false, false, 'menu', '2026-03-11 01:52:15.058', '2026-03-12 04:00:52.367', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (2, '用户管理', '/system/users', 'user', 'system/user/index', NULL, 1, 1, false, false, 'menu', '2026-03-11 01:52:15.088', '2026-03-12 04:00:52.375', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (3, '角色管理', '/system/roles', 'peoples', 'system/role/index', NULL, 1, 2, false, false, 'menu', '2026-03-11 01:52:15.117', '2026-03-12 04:00:52.382', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (4, '菜单管理', '/system/menus', 'menu', 'system/menu/index', NULL, 1, 3, false, false, 'menu', '2026-03-11 01:52:15.142', '2026-03-12 04:00:52.387', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (20, '商品管理', '/products', 'shopping', 'Layout', NULL, NULL, 3, true, false, 'menu', '2026-03-11 01:52:16.843', '2026-03-12 04:00:52.481', '2026-03-12 04:00:52.479');
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (21, '商品档案', '/products/list', 'goods', 'products/index', NULL, 30, 4, false, false, 'menu', '2026-03-11 01:52:17.169', '2026-03-12 04:00:52.486', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (22, '库存查询', '/inventories', 'inventory', 'inventories/index', NULL, 30, 7, false, false, 'menu', '2026-03-11 01:52:17.262', '2026-03-12 04:00:52.49', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (31, '采购订单', '/purchases', 'order', 'purchases/index', NULL, 30, 1, false, false, 'menu', '2026-03-11 01:52:17.359', '2026-03-12 04:00:52.503', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (32, '采购入库', '/purchase-receipts', 'inbound', 'purchase-receipts/index', NULL, 30, 2, false, false, 'menu', '2026-03-11 01:52:17.403', '2026-03-12 04:00:52.507', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (33, '采购退货', '/purchase-returns', 'return', 'purchase-returns/index', NULL, 30, 3, false, false, 'menu', '2026-03-11 01:52:17.443', '2026-03-12 04:00:52.511', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (34, '销售订单', '/orders', 'order', 'orders/index', NULL, 40, 3, false, false, 'menu', '2026-03-11 01:52:17.532', '2026-03-12 04:00:52.515', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (35, '发货管理', '/shipments', 'shipment', 'shipments/index', NULL, 40, 4, false, false, 'menu', '2026-03-11 01:52:17.696', '2026-03-12 04:00:52.519', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (36, '销售退货', '/sale-returns', 'return', 'sale-returns/index', NULL, 40, 5, false, false, 'menu', '2026-03-11 01:52:17.829', '2026-03-12 04:00:52.524', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (37, '库存调拨', '/transfers', 'transfer', 'transfers/index', NULL, 30, 8, false, false, 'menu', '2026-03-11 01:52:18.013', '2026-03-12 04:00:52.528', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (38, '库存调整', '/adjustments', 'adjust', 'adjustments/index', NULL, 30, 9, false, false, 'menu', '2026-03-11 01:52:18.225', '2026-03-12 04:00:52.532', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (39, '库存流水', '/inventory-logs', 'log', 'inventory-logs/index', NULL, 30, 10, false, false, 'menu', '2026-03-11 01:52:18.45', '2026-03-12 04:00:52.536', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (41, '购物车管理', '/carts', 'cart', 'carts/index', NULL, 40, 1, false, false, 'menu', '2026-03-11 01:52:18.792', '2026-03-12 04:00:52.547', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (42, '商城商品', '/mall-products', 'storefront', 'mall-products/index', NULL, 40, 2, false, false, 'menu', '2026-03-12 03:49:10.475', '2026-03-12 04:00:52.551', NULL);
INSERT INTO public."Menu" (id, name, path, icon, component, redirect, "parentId", "order", hidden, "alwaysShow", type, "createdAt", "updatedAt", "deletedAt") VALUES (43, '轮播图管理', '/banners', 'slideshow', 'banners/index', NULL, 40, 6, false, false, 'menu', '2026-03-13 08:40:51.39', '2026-03-13 08:40:51.39', NULL);


ALTER TABLE public."Menu" ENABLE TRIGGER ALL;

--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."Order" DISABLE TRIGGER ALL;



ALTER TABLE public."Order" ENABLE TRIGGER ALL;

--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."OrderItem" DISABLE TRIGGER ALL;



ALTER TABLE public."OrderItem" ENABLE TRIGGER ALL;

--
-- Data for Name: Supplier; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."Supplier" DISABLE TRIGGER ALL;

INSERT INTO public."Supplier" (id, name, code, contact, phone, email, address, "bankName", "bankAccount", "taxNo", "creditLimit", period, "isEnabled", remark, "createdAt", "updatedAt", "deletedAt") VALUES (1, '示例供应商', 'SUP001', '张三', '13800138000', 'supplier@example.com', '北京市朝阳区示例路1号', NULL, NULL, NULL, 50000.00, 30, true, '系统示例供应商', '2026-03-11 01:52:20.065', '2026-03-11 01:52:20.065', NULL);


ALTER TABLE public."Supplier" ENABLE TRIGGER ALL;

--
-- Data for Name: Purchase; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."Purchase" DISABLE TRIGGER ALL;

INSERT INTO public."Purchase" (id, "orderNo", "supplierId", "warehouseId", "totalAmount", discount, payable, paid, status, "orderDate", "deliveryDate", remark, "createdBy", "createdAt", "updatedAt", "deletedAt") VALUES (1, 'CG202603133084', 1, 1, 400.00, 0.00, 400.00, 0.00, 'COMPLETED', '2026-03-13 08:12:24.621', NULL, '', 1, '2026-03-13 08:12:24.629', '2026-03-13 08:12:56.367', NULL);


ALTER TABLE public."Purchase" ENABLE TRIGGER ALL;

--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."Payment" DISABLE TRIGGER ALL;



ALTER TABLE public."Payment" ENABLE TRIGGER ALL;

--
-- Data for Name: PrintTemplate; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."PrintTemplate" DISABLE TRIGGER ALL;



ALTER TABLE public."PrintTemplate" ENABLE TRIGGER ALL;

--
-- Data for Name: Printer; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."Printer" DISABLE TRIGGER ALL;



ALTER TABLE public."Printer" ENABLE TRIGGER ALL;

--
-- Data for Name: PrinterConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."PrinterConfig" DISABLE TRIGGER ALL;



ALTER TABLE public."PrinterConfig" ENABLE TRIGGER ALL;

--
-- Data for Name: ProductMallInfo; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."ProductMallInfo" DISABLE TRIGGER ALL;



ALTER TABLE public."ProductMallInfo" ENABLE TRIGGER ALL;

--
-- Data for Name: ProductSkuMallInfo; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."ProductSkuMallInfo" DISABLE TRIGGER ALL;



ALTER TABLE public."ProductSkuMallInfo" ENABLE TRIGGER ALL;

--
-- Data for Name: PurchaseItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."PurchaseItem" DISABLE TRIGGER ALL;

INSERT INTO public."PurchaseItem" (id, "purchaseId", "skuId", quantity, received, price, amount, "createdAt") VALUES (1, 1, 4, 1, 1, 100.00, 100.00, '2026-03-13 08:12:24.629');
INSERT INTO public."PurchaseItem" (id, "purchaseId", "skuId", quantity, received, price, amount, "createdAt") VALUES (2, 1, 5, 1, 1, 100.00, 100.00, '2026-03-13 08:12:24.629');
INSERT INTO public."PurchaseItem" (id, "purchaseId", "skuId", quantity, received, price, amount, "createdAt") VALUES (3, 1, 6, 1, 1, 100.00, 100.00, '2026-03-13 08:12:24.629');
INSERT INTO public."PurchaseItem" (id, "purchaseId", "skuId", quantity, received, price, amount, "createdAt") VALUES (4, 1, 7, 1, 1, 100.00, 100.00, '2026-03-13 08:12:24.629');


ALTER TABLE public."PurchaseItem" ENABLE TRIGGER ALL;

--
-- Data for Name: PurchaseReceipt; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."PurchaseReceipt" DISABLE TRIGGER ALL;

INSERT INTO public."PurchaseReceipt" (id, "receiptNo", "purchaseId", "warehouseId", status, "totalAmount", remark, "createdBy", "createdAt", "updatedAt", "deletedAt") VALUES (1, 'RK202603138934', 1, 1, 'RECEIVED', 400.00, '', 1, '2026-03-13 08:12:53.749', '2026-03-13 08:12:56.301', NULL);


ALTER TABLE public."PurchaseReceipt" ENABLE TRIGGER ALL;

--
-- Data for Name: PurchaseReceiptItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."PurchaseReceiptItem" DISABLE TRIGGER ALL;

INSERT INTO public."PurchaseReceiptItem" (id, "receiptId", "skuId", quantity, price, "createdAt") VALUES (1, 1, 4, 1, 100.00, '2026-03-13 08:12:53.749');
INSERT INTO public."PurchaseReceiptItem" (id, "receiptId", "skuId", quantity, price, "createdAt") VALUES (2, 1, 5, 1, 100.00, '2026-03-13 08:12:53.749');
INSERT INTO public."PurchaseReceiptItem" (id, "receiptId", "skuId", quantity, price, "createdAt") VALUES (3, 1, 6, 1, 100.00, '2026-03-13 08:12:53.749');
INSERT INTO public."PurchaseReceiptItem" (id, "receiptId", "skuId", quantity, price, "createdAt") VALUES (4, 1, 7, 1, 100.00, '2026-03-13 08:12:53.749');


ALTER TABLE public."PurchaseReceiptItem" ENABLE TRIGGER ALL;

--
-- Data for Name: PurchaseReturn; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."PurchaseReturn" DISABLE TRIGGER ALL;



ALTER TABLE public."PurchaseReturn" ENABLE TRIGGER ALL;

--
-- Data for Name: PurchaseReturnItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."PurchaseReturnItem" DISABLE TRIGGER ALL;



ALTER TABLE public."PurchaseReturnItem" ENABLE TRIGGER ALL;

--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."Role" DISABLE TRIGGER ALL;

INSERT INTO public."Role" (id, name, code, description, "createdAt", "updatedAt", "deletedAt") VALUES (1, '超级管理员', 'admin', '拥有所有权限的超级管理员角色', '2026-03-11 01:52:14.99', '2026-03-12 04:00:52.304', NULL);
INSERT INTO public."Role" (id, name, code, description, "createdAt", "updatedAt", "deletedAt") VALUES (2, '普通用户', 'user', '普通用户角色', '2026-03-11 01:52:15.028', '2026-03-12 04:00:52.36', NULL);


ALTER TABLE public."Role" ENABLE TRIGGER ALL;

--
-- Data for Name: Shipment; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."Shipment" DISABLE TRIGGER ALL;



ALTER TABLE public."Shipment" ENABLE TRIGGER ALL;

--
-- Data for Name: SaleReturn; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."SaleReturn" DISABLE TRIGGER ALL;



ALTER TABLE public."SaleReturn" ENABLE TRIGGER ALL;

--
-- Data for Name: SaleReturnItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."SaleReturnItem" DISABLE TRIGGER ALL;



ALTER TABLE public."SaleReturnItem" ENABLE TRIGGER ALL;

--
-- Data for Name: ShipmentItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."ShipmentItem" DISABLE TRIGGER ALL;



ALTER TABLE public."ShipmentItem" ENABLE TRIGGER ALL;

--
-- Data for Name: Transfer; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."Transfer" DISABLE TRIGGER ALL;



ALTER TABLE public."Transfer" ENABLE TRIGGER ALL;

--
-- Data for Name: TransferItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."TransferItem" DISABLE TRIGGER ALL;



ALTER TABLE public."TransferItem" ENABLE TRIGGER ALL;

--
-- Data for Name: _RoleMenus; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."_RoleMenus" DISABLE TRIGGER ALL;

INSERT INTO public."_RoleMenus" ("A", "B") VALUES (43, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (5, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (6, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (7, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (10, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (11, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (12, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (13, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (14, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (15, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (16, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (30, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (40, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (1, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (2, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (3, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (4, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (21, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (22, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (31, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (32, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (33, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (34, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (35, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (36, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (37, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (38, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (39, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (41, 1);
INSERT INTO public."_RoleMenus" ("A", "B") VALUES (42, 1);


ALTER TABLE public."_RoleMenus" ENABLE TRIGGER ALL;

--
-- Data for Name: _UserRoles; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public."_UserRoles" DISABLE TRIGGER ALL;

INSERT INTO public."_UserRoles" ("A", "B") VALUES (1, 1);


ALTER TABLE public."_UserRoles" ENABLE TRIGGER ALL;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

ALTER TABLE public._prisma_migrations DISABLE TRIGGER ALL;

INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('b3583424-df3b-4b39-a862-857ae064b6ee', 'bb8dde8879dcc0bf2ff012cea97c99d5f24c714a1d9ba867ff3c221266406461', '2026-03-11 01:52:05.211322+00', '20260112091831_init', NULL, NULL, '2026-03-11 01:52:05.122682+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('00e3f935-6380-48c9-b3d2-bdf48cfc6c0e', '6dacde7f4b4975f946415b799538f8cf115ae1f1779d41f9ae374e60e2acfa3b', '2026-03-11 01:52:05.931793+00', '20260310140000_simplify_printer_model', NULL, NULL, '2026-03-11 01:52:05.878858+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('32520d68-a3f3-4f64-b2fc-b5b0a0c37da8', 'b1865352a3426f06e2d0a3f4e29b89d3365b18436e9049d9989e28423ef07720', '2026-03-11 01:52:05.303051+00', '20260212010000_add_basic_data', NULL, NULL, '2026-03-11 01:52:05.213541+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('02eb735d-6b6a-4725-a767-61e87f7df9e7', 'd403041478ec82c36debd9ab0cef27ab78356e038cbf2706f037c56d70472e0b', '2026-03-11 01:52:05.359834+00', '20260213150434_add_product_module', NULL, NULL, '2026-03-11 01:52:05.304911+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('cbf5c27a-3c44-42a3-bf90-543f8f587884', 'a9f0e03e4cb4734125e52c25170f0d0baf62d4769ba6f6cc9cfd70fcfd4086a5', '2026-03-11 01:52:05.397782+00', '20260213174124_add_soft_delete', NULL, NULL, '2026-03-11 01:52:05.361365+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('22cd361e-712a-480f-8c7c-deb2104db615', '2c52fab5c146a7e151b3418e5777c7df8c79ba0cebb58513534dca14e17ca459', '2026-03-11 01:52:05.941098+00', '20260310162026_add_printer_config_fields', NULL, NULL, '2026-03-11 01:52:05.933772+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('7a849e45-27b3-4416-a7d5-6bcace494609', '122d743a0403e77ad7e0ed9447f5b8826f2fbdbc55612d936eff004dd13c2eec', '2026-03-11 01:52:05.403537+00', '20260213174158_add_soft_delete', NULL, NULL, '2026-03-11 01:52:05.399502+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('2fd8e1ea-8ec4-43b3-b30b-aac0be1692a2', '7a62e20ed6916ee39424fef2787fcb3f31000396e7e5586030faf511dfe3e4f6', '2026-03-11 01:52:05.418197+00', '20260214014000_unify_soft_delete', NULL, NULL, '2026-03-11 01:52:05.405305+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('54e337fc-59ab-4213-996a-1dd3ea249608', 'c4449db254ed97f68add739b37f93d08b9cad5a1dfdc94ed6221bc512a596fcc', '2026-03-11 01:52:05.519015+00', '20260215185028_add_purchase_module', NULL, NULL, '2026-03-11 01:52:05.42014+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('dfda2b31-f4e8-4f64-a7fb-b7b5f8893fb1', 'c242c40c8f64bda4eee126097342f5db627024386ec92dc807ce84aca1ddd00b', '2026-03-11 01:52:05.949075+00', '20260310162838_remove_code_autoprint_from_printer_config', NULL, NULL, '2026-03-11 01:52:05.942607+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('7170296e-b8d9-419e-9e03-b6eefb8e64e2', '447e3491f96c22c93d62f58f06e049113dd3a70a989fda26f2ffea4a791d6736', '2026-03-11 01:52:05.568183+00', '20260215234553_add_purchase_returns', NULL, NULL, '2026-03-11 01:52:05.520541+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('b6223460-83c8-48ea-8f5a-51979b11e218', '07010e0fd5b23b49ddcbbbed6a59b75d2b4de3f5094802d03e124c8714d11d95', '2026-03-11 01:52:05.65295+00', '20260216003747_add_sales_module', NULL, NULL, '2026-03-11 01:52:05.570198+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('dc4000bb-008b-446d-8588-33e47c28cfde', 'e0616a846ee9b3476926eef019dd8004cc5ab4bb95aa502195028d6e8299d730', '2026-03-11 01:52:05.699186+00', '20260217011454_add_sale_return', NULL, NULL, '2026-03-11 01:52:05.6544+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('1ac4616c-b7e7-4d77-85b8-2c11430a5e5f', 'd4d975dcbed784a1621ecce42f1d8f9cd0665b1bf14c383bdb89512ae701d46d', '2026-03-11 01:52:05.957478+00', '20260310165144_update_print_template_remove_code', NULL, NULL, '2026-03-11 01:52:05.950733+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('37718929-8e72-48e7-96f6-29cdc8459f69', 'b324ede96a5ceb1846509f62a12e1d3204883c81c4fce8e64b9ffd79b8d4849a', '2026-03-11 01:52:05.789673+00', '20260217012145_add_inventory_management', NULL, NULL, '2026-03-11 01:52:05.701253+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('6fa911f6-5557-4ca8-ad6d-41378a1227cf', 'e3439c3dfaca02896ac6a936bc5c2683bf282f44d4bfaf2250be7112028020d9', '2026-03-11 01:52:05.8145+00', '20260217015414_add_cart_table', NULL, NULL, '2026-03-11 01:52:05.791359+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('baf9ea41-fd98-4ac6-a06f-03020410e103', '79f9d308c2aadbf99a8e98a81465a3811ba90627c71d1c1e94e278a2c5432710', '2026-03-11 01:52:05.877066+00', '20260310133741_add_print_modules', NULL, NULL, '2026-03-11 01:52:05.815911+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('46e12bd5-b81f-44ab-88db-acdedac2e4ee', '3cbbed0d7768094973052892f72022367d55afdc5c920230c571492d433d2602', '2026-03-11 01:52:05.968245+00', '20260310165925_update_paper_default', NULL, NULL, '2026-03-11 01:52:05.958862+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('3ce6a2cc-8d83-40be-a987-5d5732df152b', '3a2198b0daedc636e35fb14571c117b0564b29dc4c2c3eefe0aa7ddef317ef83', '2026-03-12 03:49:10.532585+00', '20260311170232_add_product_mall_enabled', NULL, NULL, '2026-03-12 03:49:10.522076+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('276a2578-cd12-47f4-a580-2615659d03d3', 'e60dcf8792111de3e0188c2e5f4c882e3dd0f0f49200f003e34499689ef63383', '2026-03-12 03:49:10.567459+00', '20260312093000_add_product_mall_info_tables', NULL, NULL, '2026-03-12 03:49:10.53521+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('3b37e367-1bfb-48a3-b62e-dc0bb2940e5b', '6b07060f1ae419318f9e4a3e5e5700bc6f9048a46dc4e406689cb3bc5e103ce2', '2026-03-13 08:39:07.448807+00', '20260313083907_add_banners_module', NULL, NULL, '2026-03-13 08:39:07.423873+00', 1);


ALTER TABLE public._prisma_migrations ENABLE TRIGGER ALL;

--
-- Name: AdjustmentItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."AdjustmentItem_id_seq"', 1, false);


--
-- Name: Adjustment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Adjustment_id_seq"', 1, false);


--
-- Name: Banner_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Banner_id_seq"', 1, false);


--
-- Name: Brand_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Brand_id_seq"', 3, true);


--
-- Name: Cart_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Cart_id_seq"', 1, false);


--
-- Name: Category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Category_id_seq"', 5, true);


--
-- Name: Customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Customer_id_seq"', 1, false);


--
-- Name: InventoryLog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."InventoryLog_id_seq"', 4, true);


--
-- Name: Inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Inventory_id_seq"', 4, true);


--
-- Name: Menu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Menu_id_seq"', 1, false);


--
-- Name: OrderItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."OrderItem_id_seq"', 1, false);


--
-- Name: Order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Order_id_seq"', 1, false);


--
-- Name: Payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Payment_id_seq"', 1, false);


--
-- Name: PrintTemplate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PrintTemplate_id_seq"', 1, false);


--
-- Name: PrinterConfig_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PrinterConfig_id_seq"', 1, false);


--
-- Name: Printer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Printer_id_seq"', 1, false);


--
-- Name: ProductSku_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ProductSku_id_seq"', 7, true);


--
-- Name: Product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Product_id_seq"', 2, true);


--
-- Name: PurchaseItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PurchaseItem_id_seq"', 4, true);


--
-- Name: PurchaseReceiptItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PurchaseReceiptItem_id_seq"', 4, true);


--
-- Name: PurchaseReceipt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PurchaseReceipt_id_seq"', 1, true);


--
-- Name: PurchaseReturnItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PurchaseReturnItem_id_seq"', 1, false);


--
-- Name: PurchaseReturn_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PurchaseReturn_id_seq"', 1, false);


--
-- Name: Purchase_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Purchase_id_seq"', 1, true);


--
-- Name: Role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Role_id_seq"', 6, true);


--
-- Name: SaleReturnItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SaleReturnItem_id_seq"', 1, false);


--
-- Name: SaleReturn_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."SaleReturn_id_seq"', 1, false);


--
-- Name: ShipmentItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ShipmentItem_id_seq"', 1, false);


--
-- Name: Shipment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Shipment_id_seq"', 1, false);


--
-- Name: Supplier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Supplier_id_seq"', 1, true);


--
-- Name: TransferItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."TransferItem_id_seq"', 1, false);


--
-- Name: Transfer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Transfer_id_seq"', 1, false);


--
-- Name: Unit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Unit_id_seq"', 8, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_id_seq"', 1, true);


--
-- Name: Warehouse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Warehouse_id_seq"', 1, true);


--
-- PostgreSQL database dump complete
--

