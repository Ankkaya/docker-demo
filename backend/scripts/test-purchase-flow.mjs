const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3001';
const USERNAME = process.env.TEST_USERNAME || 'admin';
const PASSWORD = process.env.TEST_PASSWORD || '123456';

const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} failed: ${response.status} ${JSON.stringify(payload)}`);
  }

  if (payload && typeof payload === 'object' && 'code' in payload) {
    if (payload.code !== 200) {
      throw new Error(`${options.method || 'GET'} ${path} business failed: ${JSON.stringify(payload)}`);
    }
    return payload.data;
  }

  return payload;
}

async function login() {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: USERNAME,
      password: PASSWORD,
    }),
  });

  return data.token;
}

async function authedRequest(token, path, options = {}) {
  return request(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

async function createCategory(token, namePrefix, codePrefix, sort) {
  return authedRequest(token, '/categories', {
    method: 'POST',
    body: JSON.stringify({
      name: `${namePrefix}-${runId}`,
      code: `${codePrefix}${runId}`,
      level: 1,
      sort,
      isEnabled: true,
      mallRecommend: false,
      mallRecommendSort: 0,
      remark: `采购流程测试分类-${runId}`,
    }),
  });
}

async function createUnit(token) {
  return authedRequest(token, '/units', {
    method: 'POST',
    body: JSON.stringify({
      name: `测试件-${runId}`,
      code: `TU${runId}`,
      sort: 99,
    }),
  });
}

async function createBrand(token) {
  return authedRequest(token, '/brands', {
    method: 'POST',
    body: JSON.stringify({
      name: `测试品牌-${runId}`,
      description: `采购流程测试品牌-${runId}`,
      sort: 99,
      isEnabled: true,
    }),
  });
}

async function createWarehouse(token) {
  return authedRequest(token, '/warehouses', {
    method: 'POST',
    body: JSON.stringify({
      name: `测试仓库-${runId}`,
      code: `TCK${runId}`,
      address: '上海市浦东新区测试路 100 号',
      contact: '测试员',
      phone: '13800000000',
      isDefault: false,
      isEnabled: true,
    }),
  });
}

async function createSupplier(token) {
  return authedRequest(token, '/suppliers', {
    method: 'POST',
    body: JSON.stringify({
      name: `测试供应商-${runId}`,
      code: `SUP${runId}`,
      contact: '采购专员',
      phone: '13900000000',
      email: `supplier-${runId}@example.com`,
      address: '上海市闵行区供应商大道 88 号',
      bankName: '中国银行上海分行',
      bankAccount: `622200000000${runId.slice(-6)}`,
      taxNo: `91310000${runId.slice(-10)}`,
      creditLimit: 500000,
      period: 30,
      isEnabled: true,
      remark: `采购流程测试供应商-${runId}`,
    }),
  });
}

async function createProduct(token, payload) {
  return authedRequest(token, '/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function createPurchase(token, payload) {
  return authedRequest(token, '/purchases', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function auditPurchase(token, purchaseId) {
  return authedRequest(token, `/purchases/${purchaseId}/audit`, {
    method: 'PATCH',
    body: JSON.stringify({
      action: 'APPROVE',
      remark: `自动审核-${runId}`,
    }),
  });
}

async function createReceipt(token, payload) {
  return authedRequest(token, '/purchase-receipts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

function buildProducts(categoryA, categoryB, unit, brand) {
  const productASeed = `product-a-${runId}`;
  const productBSeed = `product-b-${runId}`;

  return [
    {
      name: `测试商品A-${runId}`,
      categoryId: categoryA.id,
      brandId: brand.id,
      unitId: unit.id,
      description: '采购流程测试商品A',
      detail: '<p>自动化测试商品A</p>',
      mainImage: `https://picsum.photos/seed/${productASeed}-main/960/960`,
      images: [
        `https://picsum.photos/seed/${productASeed}-gallery-1/960/960`,
        `https://picsum.photos/seed/${productASeed}-gallery-2/960/960`,
        `https://picsum.photos/seed/${productASeed}-gallery-3/960/960`,
      ],
      isEnabled: true,
      mallEnabled: false,
      specTemplate: [
        { name: '颜色', values: ['黑色', '白色'] },
        { name: '容量', values: ['64G', '128G'] },
      ],
      skus: [
        {
          specs: [
            { name: '颜色', value: '黑色' },
            { name: '容量', value: '64G' },
          ],
          costPrice: 120,
          salePrice: 168,
          marketPrice: 188,
          image: `https://picsum.photos/seed/${productASeed}-sku-1/960/960`,
          barcode: `A${runId}01`,
          isDefault: true,
          sort: 1,
        },
        {
          specs: [
            { name: '颜色', value: '白色' },
            { name: '容量', value: '128G' },
          ],
          costPrice: 135,
          salePrice: 188,
          marketPrice: 208,
          image: `https://picsum.photos/seed/${productASeed}-sku-2/960/960`,
          barcode: `A${runId}02`,
          sort: 2,
        },
      ],
    },
    {
      name: `测试商品B-${runId}`,
      categoryId: categoryB.id,
      brandId: brand.id,
      unitId: unit.id,
      description: '采购流程测试商品B',
      detail: '<p>自动化测试商品B</p>',
      mainImage: `https://picsum.photos/seed/${productBSeed}-main/960/960`,
      images: [
        `https://picsum.photos/seed/${productBSeed}-gallery-1/960/960`,
        `https://picsum.photos/seed/${productBSeed}-gallery-2/960/960`,
        `https://picsum.photos/seed/${productBSeed}-gallery-3/960/960`,
      ],
      isEnabled: true,
      mallEnabled: false,
      specTemplate: [
        { name: '口味', values: ['原味', '草莓', '芒果'] },
      ],
      skus: [
        {
          specs: [{ name: '口味', value: '原味' }],
          costPrice: 18,
          salePrice: 29.9,
          marketPrice: 35,
          image: `https://picsum.photos/seed/${productBSeed}-sku-1/960/960`,
          barcode: `B${runId}01`,
          isDefault: true,
          sort: 1,
        },
        {
          specs: [{ name: '口味', value: '草莓' }],
          costPrice: 19,
          salePrice: 31.9,
          marketPrice: 36,
          image: `https://picsum.photos/seed/${productBSeed}-sku-2/960/960`,
          barcode: `B${runId}02`,
          sort: 2,
        },
        {
          specs: [{ name: '口味', value: '芒果' }],
          costPrice: 20,
          salePrice: 32.9,
          marketPrice: 37,
          image: `https://picsum.photos/seed/${productBSeed}-sku-3/960/960`,
          barcode: `B${runId}03`,
          sort: 3,
        },
      ],
    },
  ];
}

async function main() {
  console.log(`开始执行采购流程测试，BASE_URL=${BASE_URL}，runId=${runId}`);

  const token = await login();
  console.log('管理员登录成功');

  const [unit, brand, warehouse, supplier, categoryA, categoryB] = await Promise.all([
    createUnit(token),
    createBrand(token),
    createWarehouse(token),
    createSupplier(token),
    createCategory(token, '测试分类A', 'TCA', 10),
    createCategory(token, '测试分类B', 'TCB', 20),
  ]);

  console.log('基础资料创建成功');

  const productPayloads = buildProducts(categoryA, categoryB, unit, brand);
  const createdProducts = [];
  for (const productPayload of productPayloads) {
    const created = await createProduct(token, productPayload);
    createdProducts.push(created);
  }

  console.log('商品档案创建成功');

  const purchaseItems = createdProducts.flatMap((product, productIndex) =>
    product.skus.map((sku, skuIndex) => ({
      skuId: sku.id,
      quantity: productIndex === 0 ? 10 + skuIndex * 5 : 20 + skuIndex * 3,
      price: Number(sku.costPrice),
    })),
  );

  const purchase = await createPurchase(token, {
    supplierId: supplier.id,
    warehouseId: warehouse.id,
    items: purchaseItems,
    discount: 25,
    remark: `自动化采购测试单-${runId}`,
    deliveryDate: '2026-04-30',
  });

  console.log(`采购订单创建成功，id=${purchase.id}，orderNo=${purchase.orderNo}`);

  const auditedPurchase = await auditPurchase(token, purchase.id);
  console.log(`采购订单审核成功，状态=${auditedPurchase.status}`);

  const receipt = await createReceipt(token, {
    purchaseId: purchase.id,
    items: purchase.items.map((item) => ({
      skuId: item.skuId,
      quantity: item.quantity,
      price: Number(item.price),
    })),
    remark: `自动化采购入库测试单-${runId}`,
  });

  console.log(`采购入库单创建成功，id=${receipt.id}，receiptNo=${receipt.receiptNo}`);

  const summary = {
    runId,
    baseUrl: BASE_URL,
    unit: { id: unit.id, name: unit.name, code: unit.code },
    brand: { id: brand.id, name: brand.name },
    warehouse: { id: warehouse.id, name: warehouse.name, code: warehouse.code },
    supplier: { id: supplier.id, name: supplier.name, code: supplier.code },
    categories: [
      { id: categoryA.id, name: categoryA.name, code: categoryA.code },
      { id: categoryB.id, name: categoryB.name, code: categoryB.code },
    ],
    products: createdProducts.map((product) => ({
      id: product.id,
      name: product.name,
      spuCode: product.spuCode,
      skuCount: product.skus.length,
      skus: product.skus.map((sku) => ({
        id: sku.id,
        skuCode: sku.skuCode,
        costPrice: sku.costPrice,
        salePrice: sku.salePrice,
      })),
    })),
    purchase: {
      id: purchase.id,
      orderNo: purchase.orderNo,
      statusAfterAudit: auditedPurchase.status,
      itemCount: purchase.items.length,
      totalAmount: purchase.totalAmount,
      payable: purchase.payable,
    },
    receipt: {
      id: receipt.id,
      receiptNo: receipt.receiptNo,
      status: receipt.status,
      totalAmount: receipt.totalAmount,
      itemCount: receipt.items.length,
    },
  };

  console.log('\n流程执行完成，结果摘要如下:');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error('\n流程执行失败:');
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
