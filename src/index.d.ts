/**
 * @param {string | null} a
 * @param {string | null} b
 * @param {string=} digits
 * @return {string}
 */
export function generateKeyBetween(
  a: string | null,
  b: string | null,
  digits?: string | undefined
): string;
/**
 * @param {string | null} a
 * @param {string | null} b
 * @param {number} n
 * @param {string} digits
 * @return {string[]}
 */
export function generateNKeysBetween(
  a: string | null,
  b: string | null,
  n: number,
  digits?: string
): string[];
export const BASE_62_DIGITS: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
