/**
 * @param {string | null} a
 * @param {string | null} b
 * @param {string=} digits
 * @return {string}
 */
export function generateKeyBetween(a: string | null, b: string | null, digits?: string | undefined): string;
/**
 * same preconditions as generateKeysBetween.
 * n >= 0.
 * Returns an array of n distinct keys in sorted order.
 * If a and b are both null, returns [a0, a1, ...]
 * If one or the other is null, returns consecutive "integer"
 * keys.  Otherwise, returns relatively short keys between
 * a and b.
 * @param {string | null} a
 * @param {string | null} b
 * @param {number} n
 * @param {string} digits
 * @return {string[]}
 */
export function generateNKeysBetween(a: string | null, b: string | null, n: number, digits?: string): string[];
export const BASE_62_DIGITS: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
