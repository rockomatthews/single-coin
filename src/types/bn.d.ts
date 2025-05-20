/**
 * Type declarations for bn.js
 */
declare module 'bn.js' {
  export default class BN {
    constructor(number: number | string | BN, base?: number | 'hex', endian?: string);
    toString(base?: number | 'hex', length?: number): string;
    toNumber(): number;
    toJSON(): string;
    toArray(endian?: string, length?: number): number[];
    toBuffer(endian?: string, length?: number): Buffer;
    add(b: BN): BN;
    sub(b: BN): BN;
    mul(b: BN): BN;
    div(b: BN): BN;
    mod(b: BN): BN;
    neg(): BN;
    abs(): BN;
    cmp(b: BN): number;
    gt(b: BN): boolean;
    gte(b: BN): boolean;
    lt(b: BN): boolean;
    lte(b: BN): boolean;
    eq(b: BN): boolean;
    isZero(): boolean;
    toTwos(width: number): BN;
    fromTwos(width: number): BN;
    pow(b: BN): BN;
    clone(): BN;
  }
} 