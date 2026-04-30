import { Prisma } from '@prisma/client';
import {
  D,
  addMoney,
  subMoney,
  subMoneyClampZero,
  mulMoney,
  sumMoney,
  toYuan,
  yuanToFen,
  moneyEq,
  moneyGt,
  moneyLt,
} from '@/common/utils/money';

describe('money utils', () => {
  describe('D()', () => {
    it('should treat null/undefined as 0', () => {
      expect(D(null).toString()).toBe('0');
      expect(D(undefined).toString()).toBe('0');
    });

    it('should preserve Decimal precision from string', () => {
      expect(D('19.99').toString()).toBe('19.99');
    });
  });

  describe('addMoney / subMoney', () => {
    it('should correctly add 0.1 + 0.2 (precision-safe)', () => {
      // 经典浮点陷阱：JS 中 0.1 + 0.2 = 0.30000000000000004
      const result = addMoney(0.1, 0.2);
      expect(result.toFixed(2)).toBe('0.30');
      expect(toYuan(result)).toBe(0.3);
    });

    it('should subtract Decimal-from-DB style values without drift', () => {
      const payable = new Prisma.Decimal('19.99');
      const paid = new Prisma.Decimal('5.55');
      expect(subMoney(payable, paid).toFixed(2)).toBe('14.44');
    });

    it('should handle null/undefined as 0', () => {
      expect(addMoney(null, 10, undefined).toFixed(2)).toBe('10.00');
    });
  });

  describe('subMoneyClampZero', () => {
    it('should clamp negative result to 0', () => {
      expect(subMoneyClampZero(5, 10).toString()).toBe('0');
    });

    it('should preserve positive result', () => {
      expect(subMoneyClampZero(10, 3).toFixed(2)).toBe('7.00');
    });

    it('should handle equal values as 0', () => {
      expect(subMoneyClampZero('19.99', '19.99').toString()).toBe('0');
    });
  });

  describe('mulMoney', () => {
    it('should not drift on price * integer quantity', () => {
      // 19.99 * 3 = 59.97 (但 JS number: 59.97000000000001)
      expect(mulMoney('19.99', 3).toFixed(2)).toBe('59.97');
    });
  });

  describe('sumMoney', () => {
    it('should sum array of items via picker', () => {
      const items = [
        { price: '19.99', qty: 3 },
        { price: '0.10', qty: 2 },
      ];
      const total = sumMoney(items, (i) => mulMoney(i.price, i.qty));
      expect(total.toFixed(2)).toBe('60.17');
    });

    it('should return 0 for empty array', () => {
      expect(sumMoney([], () => 0).toString()).toBe('0');
    });
  });

  describe('comparators', () => {
    it('should compare across number / string / Decimal', () => {
      expect(moneyEq('1.00', 1)).toBe(true);
      expect(moneyEq(new Prisma.Decimal('1.00'), 1)).toBe(true);
      expect(moneyGt('1.01', 1)).toBe(true);
      expect(moneyLt(0, '0.01')).toBe(true);
    });
  });

  describe('toYuan / yuanToFen', () => {
    it('toYuan rounds to 2 decimals', () => {
      expect(toYuan('19.999')).toBe(20);
      expect(toYuan('19.994')).toBe(19.99);
    });

    it('yuanToFen converts to integer fen', () => {
      expect(yuanToFen('19.99')).toBe(1999);
      expect(yuanToFen(0.1)).toBe(10);
      // 浮点陷阱：number 1.005 实际 = 1.00499... 在 Decimal 下会得到 100
      expect(yuanToFen('1.005')).toBe(101);
    });
  });
});
