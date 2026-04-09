`test-purchase-flow.mjs` 用于走通以下后台接口流程：

1. 管理员登录
2. 新建计量单位、品牌、仓库、供应商、2 个商品分类
3. 创建 2 个商品档案
4. 每个商品创建 2-3 个 SKU
5. 创建采购订单
6. 审核采购订单
7. 引用采购订单创建采购入库单

运行方式：

```bash
cd backend
node scripts/test-purchase-flow.mjs
```

可选环境变量：

```bash
BASE_URL=http://127.0.0.1:3001
TEST_USERNAME=admin
TEST_PASSWORD=123456
```
