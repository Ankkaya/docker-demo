import { Prisma } from '@prisma/client';

/**
 * 金额工具：内部统一使用 Prisma.Decimal（精确十进制）做加减运算，
 * 仅在 VO 序列化、外部 API 适配等"边界"处转回 number/string。
 *
 * 设计原则：
 * - 数据库金额字段全部为 Decimal(12,2)，单位"元"。
 * - 业务运算：D() 转 Decimal → 链式 .add/.sub/.mul/.div → 最后 toYuan() 落地。
 * - 累加：优先使用 Prisma 的 { increment: x } / { decrement: x } 原子操作；
 *   仅当需要"非负夹断"等额外语义时才在 Service 中手动算。
 */

export type DecimalLike = Prisma.Decimal | string | number | null | undefined;

/** 转为 Decimal，null/undefined 视作 0。 */
export const D = (v: DecimalLike): Prisma.Decimal => {
  if (v == null) return new Prisma.Decimal(0);
  if (v instanceof Prisma.Decimal) return v;
  return new Prisma.Decimal(v as any);
};

/** 多个金额相加，返回 Decimal。 */
export const addMoney = (...args: DecimalLike[]): Prisma.Decimal =>
  args.reduce<Prisma.Decimal>((acc, v) => acc.add(D(v)), new Prisma.Decimal(0));

/** a - b，返回 Decimal（可为负）。 */
export const subMoney = (a: DecimalLike, b: DecimalLike): Prisma.Decimal =>
  D(a).sub(D(b));

/** a - b，结果 < 0 时夹断为 0。 */
export const subMoneyClampZero = (
  a: DecimalLike,
  b: DecimalLike,
): Prisma.Decimal => {
  const r = D(a).sub(D(b));
  return r.isNegative() ? new Prisma.Decimal(0) : r;
};

/** a * b。 */
export const mulMoney = (a: DecimalLike, b: DecimalLike): Prisma.Decimal =>
  D(a).mul(D(b));

/** 数组按 picker 累加金额。 */
export const sumMoney = <T>(
  arr: T[],
  picker: (item: T) => DecimalLike,
): Prisma.Decimal =>
  arr.reduce<Prisma.Decimal>(
    (acc, item) => acc.add(D(picker(item))),
    new Prisma.Decimal(0),
  );

// 比较函数（统一 Decimal 比较语义，避免再走 Number()）
export const moneyEq = (a: DecimalLike, b: DecimalLike): boolean =>
  D(a).eq(D(b));
export const moneyGt = (a: DecimalLike, b: DecimalLike): boolean =>
  D(a).gt(D(b));
export const moneyGte = (a: DecimalLike, b: DecimalLike): boolean =>
  D(a).gte(D(b));
export const moneyLt = (a: DecimalLike, b: DecimalLike): boolean =>
  D(a).lt(D(b));
export const moneyLte = (a: DecimalLike, b: DecimalLike): boolean =>
  D(a).lte(D(b));
export const moneyIsZero = (a: DecimalLike): boolean => D(a).isZero();
export const moneyIsPositive = (a: DecimalLike): boolean => D(a).gt(0);

/**
 * 转成"元"并保留 2 位小数的 number，仅用于 VO 输出 / 第三方 API 入参。
 * 注意：此后的 number 不应再参与业务金额累加。
 */
export const toYuan = (v: DecimalLike): number => Number(D(v).toFixed(2));

/** 转成 2 位小数字符串，用于展示（避免 number 精度噪声）。 */
export const toYuanString = (v: DecimalLike): string => D(v).toFixed(2);

/**
 * 元 → 分，用于对接微信/支付宝等外部支付 API。
 * 使用 Decimal*100 避免浮点误差，再四舍五入取整。
 */
export const yuanToFen = (v: DecimalLike): number =>
  Math.round(Number(D(v).mul(100).toFixed(0)));
