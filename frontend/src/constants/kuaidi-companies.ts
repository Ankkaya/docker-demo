/**
 * 快递100 常用快递公司编码表
 * 编码必须与快递100 官方一致（用于小程序 kdPlugin 跳转查询）
 * 完整清单：https://api.kuaidi100.com/manager/openapi/download/kdbm.do
 *
 * 列表只挑选常用的快递公司，按业务实际需要再往里加即可。
 */

export interface KuaidiCompany {
  /** 快递100 公司编码 */
  code: string;
  /** 中文名称 */
  name: string;
  /** 拼音首字母（用于搜索） */
  pinyin?: string;
}

export const KUAIDI_COMPANIES: KuaidiCompany[] = [
  // 主流国内快递
  { code: 'shunfeng', name: '顺丰速运', pinyin: 'sf shunfeng' },
  { code: 'shunfengkuaiyun', name: '顺丰快运', pinyin: 'sfky' },
  { code: 'yuantong', name: '圆通速递', pinyin: 'yt yuantong' },
  { code: 'yuantongkuaiyun', name: '圆通快运', pinyin: 'ytky' },
  { code: 'zhongtong', name: '中通快递', pinyin: 'zt zhongtong' },
  { code: 'zhongtongkuaiyun', name: '中通快运', pinyin: 'ztky' },
  { code: 'shentong', name: '申通快递', pinyin: 'st shentong' },
  { code: 'yunda', name: '韵达快递', pinyin: 'yd yunda' },
  { code: 'yundakuaiyun', name: '韵达快运', pinyin: 'ydky' },
  { code: 'jd', name: '京东物流', pinyin: 'jd jingdong' },
  { code: 'jtexpress', name: '极兔速递', pinyin: 'jt jtexpress' },

  // 邮政
  { code: 'ems', name: 'EMS', pinyin: 'ems' },
  { code: 'youzhengguonei', name: '邮政快递包裹', pinyin: 'yzgn' },
  { code: 'youzhengbk', name: '邮政标准快递', pinyin: 'yzbk' },

  // 大件 / 物流
  { code: 'debangkuaidi', name: '德邦快递', pinyin: 'db debang' },
  { code: 'debangwuliu', name: '德邦物流', pinyin: 'dbwl' },
  { code: 'zhaijisong', name: '宅急送', pinyin: 'zjs zhaijisong' },
  { code: 'kuayue', name: '跨越速运', pinyin: 'ky kuayue' },
  { code: 'annengwuliu', name: '安能物流', pinyin: 'an anneng' },
  { code: 'suning', name: '苏宁物流', pinyin: 'sn suning' },

  // 其他主流
  { code: 'huitongkuaidi', name: '百世快递', pinyin: 'bs baishi' },
  { code: 'baishiwuliu', name: '百世快运', pinyin: 'bsky' },
  { code: 'tiantian', name: '天天快递', pinyin: 'tt tiantian' },
  { code: 'youshuwuliu', name: '优速快递', pinyin: 'ys youshu' },
  { code: 'danniao', name: '丹鸟', pinyin: 'dn danniao' },
  { code: 'suer', name: '速尔快递', pinyin: 'se suer' },
  { code: 'pjbest', name: '品骏快递', pinyin: 'pj pinjun' },
  { code: 'guotongkuaidi', name: '国通快递', pinyin: 'gt guotong' },
  { code: 'xinfengwuliu', name: '信丰物流', pinyin: 'xf xinfeng' },

  // 国际
  { code: 'fedex', name: 'FedEx 联邦快递', pinyin: 'fedex' },
  { code: 'dhl', name: 'DHL 中国', pinyin: 'dhl' },
  { code: 'ups', name: 'UPS', pinyin: 'ups' },
  { code: 'tnt', name: 'TNT 快递', pinyin: 'tnt' },
  { code: 'usps', name: 'USPS 美国邮政', pinyin: 'usps' },
];

/** 通过编码查中文名；未知编码 fallback 直接返回原值 */
export function resolveKuaidiCompanyLabel(code?: string | null): string {
  if (!code) return '';
  return KUAIDI_COMPANIES.find(c => c.code === code)?.name || code;
}

/** 用于 n-select 的 options（label 显示「中文名 · 编码」便于运营对照） */
export function getKuaidiCompanyOptions() {
  return KUAIDI_COMPANIES.map(c => ({
    label: `${c.name} (${c.code})`,
    value: c.code,
    name: c.name,
    code: c.code,
    pinyin: c.pinyin,
  }));
}
