ALTER TABLE "Category"
ADD COLUMN "subtitle" TEXT,
ADD COLUMN "remark" TEXT;

UPDATE "Category"
SET
  "subtitle" = CASE
    WHEN COALESCE(NULLIF(TRIM("subtitle"), ''), '') <> '' THEN "subtitle"
    WHEN "name" = '电子产品' THEN '数码潮品，随心选购'
    WHEN "name" = '手机' THEN '热门机型，快速上新'
    WHEN "name" = '电脑' THEN '办公娱乐，性能兼顾'
    WHEN "name" = '日用百货' THEN '居家日常，一站备齐'
    ELSE CONCAT("name", '精选好物')
  END,
  "remark" = CASE
    WHEN COALESCE(NULLIF(TRIM("remark"), ''), '') <> '' THEN "remark"
    WHEN "name" = '电子产品' THEN '汇聚手机、电脑、智能配件等热门数码商品，适合商城首页重点展示。'
    WHEN "name" = '手机' THEN '覆盖主流品牌手机与配件，适合新品首发、爆款促销和日常零售场景。'
    WHEN "name" = '电脑' THEN '包含笔记本、台式机及办公设备，适合企业采购与个人办公娱乐需求。'
    WHEN "name" = '日用百货' THEN '涵盖清洁、收纳、个护等居家常用品，适合高频复购商品陈列。'
    ELSE CONCAT('用于展示', "name", '相关商品，可按业务需要补充更详细分类说明。')
  END,
  "image" = CASE
    WHEN COALESCE(NULLIF(TRIM("image"), ''), '') <> '' THEN "image"
    WHEN "name" = '电子产品' THEN 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80'
    WHEN "name" = '手机' THEN 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80'
    WHEN "name" = '电脑' THEN 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80'
    WHEN "name" = '日用百货' THEN 'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80'
    ELSE 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80'
  END
WHERE "deletedAt" IS NULL;
