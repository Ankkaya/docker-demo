export const COUPON_SCENE_TYPE = {
  COMMON: 'COMMON',
  NEW_USER: 'NEW_USER',
  FIRST_ORDER: 'FIRST_ORDER',
  RECHARGE_GIFT: 'RECHARGE_GIFT',
  ORDER_GIFT: 'ORDER_GIFT',
  MANUAL: 'MANUAL',
} as const;

export type CouponSceneTypeValue = typeof COUPON_SCENE_TYPE[keyof typeof COUPON_SCENE_TYPE];

export const COUPON_ISSUE_TYPE = {
  USER_CLAIM: 'USER_CLAIM',
  ADMIN_ASSIGN: 'ADMIN_ASSIGN',
  AUTO_GRANT: 'AUTO_GRANT',
  EXCHANGE_CODE: 'EXCHANGE_CODE',
} as const;

export type CouponIssueTypeValue = typeof COUPON_ISSUE_TYPE[keyof typeof COUPON_ISSUE_TYPE];

export const COUPON_VALID_TYPE = {
  FIXED: 'FIXED',
  RELATIVE: 'RELATIVE',
} as const;

export type CouponValidTypeValue = typeof COUPON_VALID_TYPE[keyof typeof COUPON_VALID_TYPE];

export const COUPON_ISSUE_SCOPE_TYPE = {
  ALL: 'ALL',
  CUSTOMERS: 'CUSTOMERS',
  NEW_USERS: 'NEW_USERS',
  FIRST_ORDER_USERS: 'FIRST_ORDER_USERS',
  RECHARGED_USERS: 'RECHARGED_USERS',
} as const;

export type CouponIssueScopeTypeValue = typeof COUPON_ISSUE_SCOPE_TYPE[keyof typeof COUPON_ISSUE_SCOPE_TYPE];

export const COUPON_USE_SCOPE_TYPE = {
  ALL: 'ALL',
  CATEGORY: 'CATEGORY',
  BRAND: 'BRAND',
  PRODUCT: 'PRODUCT',
  SKU: 'SKU',
} as const;

export type CouponUseScopeTypeValue = typeof COUPON_USE_SCOPE_TYPE[keyof typeof COUPON_USE_SCOPE_TYPE];

export const COUPON_REFUND_RETURN_MODE = {
  RETURN_ORIGINAL: 'RETURN_ORIGINAL',
  GRANT_NEW: 'GRANT_NEW',
  NOT_RETURN: 'NOT_RETURN',
} as const;

export type CouponRefundReturnModeValue = typeof COUPON_REFUND_RETURN_MODE[keyof typeof COUPON_REFUND_RETURN_MODE];
