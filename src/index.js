// License: CC0 (no rights reserved).

// This is based on https://observablehq.com/@dgreensp/implementing-fractional-indexing

export const BASE_62_DIGITS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

// When `intDigits` is not supplied, the integer-part head alphabet defaults to
// A-Z (negative lengths) followed by a-z (positive lengths) -- i.e. the
// equivalent of "ABC...XYZ" + "abc...xyz".

// `a` may be empty string, `b` is null or non-empty string.
// `a < b` lexicographically if `b` is non-null.
// no trailing zeros allowed.
// digits is a string such as '0123456789' for base 10.  Digits must be in
// ascending character code order!
/**
 * @param {string} a
 * @param {string | null | undefined} b
 * @param {string} digits
 * @returns {string}
 */
function midpoint(a, b, digits) {
  const zero = digits[0];
  if (b != null && a >= b) {
    throw new Error(a + " >= " + b);
  }
  if (a.slice(-1) === zero || (b && b.slice(-1) === zero)) {
    throw new Error("trailing zero");
  }
  if (b) {
    // remove longest common prefix.  pad `a` with 0s as we
    // go.  note that we don't need to pad `b`, because it can't
    // end before `a` while traversing the common prefix.
    let n = 0;
    while ((a[n] || zero) === b[n]) {
      n++;
    }
    if (n > 0) {
      return b.slice(0, n) + midpoint(a.slice(n), b.slice(n), digits);
    }
  }
  // first digits (or lack of digit) are different
  const digitA = a ? digits.indexOf(a[0]) : 0;
  const digitB = b != null ? digits.indexOf(b[0]) : digits.length;
  if (digitB - digitA > 1) {
    const midDigit = Math.round(0.5 * (digitA + digitB));
    return digits[midDigit];
  } else {
    // first digits are consecutive
    if (b && b.length > 1) {
      return b.slice(0, 1);
    } else {
      // `b` is null or has length 1 (a single digit).
      // the first digit of `a` is the previous digit to `b`,
      // or 9 if `b` is null.
      // given, for example, midpoint('49', '5'), return
      // '4' + midpoint('9', null), which will become
      // '4' + '9' + midpoint('', null), which is '495'
      return digits[digitA] + midpoint(a.slice(1), null, digits);
    }
  }
}

/**
 * @param {string} int
 * @param {string | undefined} intDigits
 * @return {void}
 */

function validateInteger(int, intDigits) {
  if (int.length !== getIntegerLength(int[0], intDigits)) {
    throw new Error("invalid integer part of order key: " + int);
  }
}

/**
 * @param {string} head
 * @param {string | undefined} intDigits
 * @return {number}
 */
function getIntegerLength(head, intDigits) {
  if (intDigits === undefined) {
    const c = head.charCodeAt(0);
    if (c >= 97 && c <= 122) { // 'a' - 'z'
      return c - 97 + 2; // 'a'
    }
    if (c >= 65 && c <= 90) { // 'A' - 'Z'
      return 90 - c + 2; // 'Z'
    }
  } else {
    // intDigits is a single lexicographically ordered (ascending) alphabet: the
    // first half are the negative-length heads and the second half the
    // positive-length heads, mirroring the default A-Z/a-z scheme. The outermost
    // characters mark the longest integer parts, and the two heads straddling
    // the midpoint mark the shortest (length 2).
    const i = intDigits.indexOf(head);
    if (i !== -1) {
      const half = intDigits.length / 2;
      return i < half ? half - i + 1 : i - half + 2;
    }
  }
  throw new Error("invalid order key head: " + head);
}

/**
 * @param {string} key
 * @param {string | undefined} intDigits
 * @return {string}
 */

function getIntegerPart(key, intDigits) {
  const integerPartLength = getIntegerLength(key[0], intDigits);
  if (integerPartLength > key.length) {
    throw new Error("invalid order key: " + key);
  }
  return key.slice(0, integerPartLength);
}

/**
 * @param {string} key
 * @param {string} digits
 * @param {string | undefined} intDigits
 * @return {void}
 */

function validateOrderKey(key, digits, intDigits) {
  if (isSmallestInteger(key, digits, intDigits)) {
    throw new Error("invalid order key: " + key);
  }
  // getIntegerPart will throw if the first character is bad,
  // or the key is too short.  we'd call it to check these things
  // even if we didn't need the result
  const i = getIntegerPart(key, intDigits);
  const f = key.slice(i.length);
  if (f.slice(-1) === digits[0]) {
    throw new Error("invalid order key: " + key);
  }
}

// note that this may return null, as there is a largest integer
/**
 * @param {string} x
 * @param {string} digits
 * @param {string | undefined} intDigits
 * @return {string | null}
 */
function incrementInteger(x, digits, intDigits) {
  validateInteger(x, intDigits);
  const [head, ...digs] = x.split("");
  let carry = true;
  for (let i = digs.length - 1; carry && i >= 0; i--) {
    const d = digits.indexOf(digs[i]) + 1;
    if (d === digits.length) {
      digs[i] = digits[0];
    } else {
      digs[i] = digits[d];
      carry = false;
    }
  }
  if (carry) {
    if (intDigits === undefined) {
      // fast path for the default A-Z/a-z markers.
      if (head === "Z") {
        return "a" + digits[0];
      }
      if (head === "z") {
        return null;
      }
      const h = String.fromCharCode(head.charCodeAt(0) + 1);
      if (h > "a") {
        digs.push(digits[0]);
      } else {
        digs.pop();
      }
      return h + digs.join("");
    }
    const headIndex = intDigits.indexOf(head);
    if (headIndex === intDigits.length - 1) {
      // already the largest integer
      return null;
    }
    const h = intDigits[headIndex + 1];
    // the head moves one step toward the largest digit; grow or shrink the digit
    // run to match the new head's integer length.
    const lengthDelta =
      getIntegerLength(h, intDigits) - getIntegerLength(head, intDigits);
    if (lengthDelta > 0) {
      digs.push(digits[0]);
    } else if (lengthDelta < 0) {
      digs.pop();
    }
    return h + digs.join("");
  } else {
    return head + digs.join("");
  }
}

// note that this may return null, as there is a smallest integer
/**
 * @param {string} x
 * @param {string} digits
 * @param {string | undefined} intDigits
 * @return {string | null}
 */

function decrementInteger(x, digits, intDigits) {
  validateInteger(x, intDigits);
  const [head, ...digs] = x.split("");
  let borrow = true;
  for (let i = digs.length - 1; borrow && i >= 0; i--) {
    const d = digits.indexOf(digs[i]) - 1;
    if (d === -1) {
      digs[i] = digits.slice(-1);
    } else {
      digs[i] = digits[d];
      borrow = false;
    }
  }
  if (borrow) {
    if (intDigits === undefined) {
      // fast path for the default A-Z/a-z markers.
      if (head === "a") {
        return "Z" + digits.slice(-1);
      }
      if (head === "A") {
        return null;
      }
      const h = String.fromCharCode(head.charCodeAt(0) - 1);
      if (h < "Z") {
        digs.push(digits.slice(-1));
      } else {
        digs.pop();
      }
      return h + digs.join("");
    }
    const headIndex = intDigits.indexOf(head);
    if (headIndex === 0) {
      // already the smallest integer
      return null;
    }
    const h = intDigits[headIndex - 1];
    // the head moves one step toward the smallest digit; grow or shrink the
    // digit run to match the new head's integer length.
    const lengthDelta =
      getIntegerLength(h, intDigits) - getIntegerLength(head, intDigits);
    if (lengthDelta > 0) {
      digs.push(digits.slice(-1));
    } else if (lengthDelta < 0) {
      digs.pop();
    }
    return h + digs.join("");
  } else {
    return head + digs.join("");
  }
}

/**
 * @type {Map<string, string>}
 */
const repeatedKeysCache = new Map();

/**
 * @param {string} key
 * @param {string} digits
 * @param {string | undefined} intDigits
 */
function isSmallestInteger(key, digits, intDigits) {
  // The smallest integer is the most-negative head (the first character of
  // intDigits, marking the longest integer part) followed by all-zero digits.
  // Use a cache to avoid constructing the same long string over and over which
  // causes unnecessary GC pressure.
  const cacheKey = JSON.stringify([intDigits, digits[0]]);
  let cached = repeatedKeysCache.get(cacheKey);
  if (!cached) {
    cached =
      intDigits === undefined
        ? "A" + digits[0].repeat(26)
        : intDigits[0] + digits[0].repeat(intDigits.length / 2);
    repeatedKeysCache.set(cacheKey, cached);
  }
  return key === cached;
}

/**
 * Generates an order key that sorts between `a` and `b`.
 *
 * `a` is the lower bound: an order key, or null for the start.
 * `b` is the upper bound: an order key, or null for the end.
 * When both are non-null, they may be passed in either order.
 *
 * `digits` is the alphabet, e.g. '0123456789' for base 10. Its characters
 * must be in ascending character code order, and may be any alphabet (it does
 * not need to contain 0-9, A-Z or a-z). This precondition is NOT validated; an
 * unsorted alphabet produces keys that do not sort correctly.
 *
 * Note that `digits` only defines the *digit values* of a key. The integer
 * part of every key also begins with a length/magnitude marker drawn from the
 * `intDigits` alphabet (A-Z for negative lengths, a-z for positive by default),
 * regardless of `digits`. So e.g. base-10 keys look like "a0", "b00" or "Z9" --
 * the leading character is a head marker, not a fractional digit. This marker
 * only ever occupies the first position and is only compared against other
 * markers, which is why `digits` and `intDigits` may overlap (or be identical)
 * and keys still sort correctly.
 *
 * `intDigits` overrides that marker alphabet. It is a single alphabet in
 * ascending (lexicographical) character order, with even length: its first half
 * are the negative-length heads and its second half the positive-length heads.
 * The outermost characters mark the longest integer parts and the two characters
 * straddling the midpoint mark the shortest (length 2). The integer part may
 * grow until it reaches the outermost heads, so a shorter alphabet limits how
 * large/small a key's integer part can become. Defaults to the equivalent of
 * "ABC...XYZ" + "abc...xyz".
 *
 * @example
 * // intDigits may reuse the digit alphabet itself. Here both are base-10, so
 * // keys contain no letters: the first half (0-4) are negative heads, the
 * // second half (5-9) positive heads, and 4/5 mark the shortest (length-2)
 * // integer parts.
 * generateKeyBetween(null, null, "0123456789", "0123456789"); // => "50"
 *
 * @param {string | null | undefined} a
 * @param {string | null | undefined} b
 * @param {string=} digits
 * @param {string=} intDigits
 * @return {string}
 */
export function generateKeyBetween(
  a,
  b,
  digits = BASE_62_DIGITS,
  intDigits = undefined
) {
  if (a != null) {
    validateOrderKey(a, digits, intDigits);
  }
  if (b != null) {
    validateOrderKey(b, digits, intDigits);
  }
  if (a != null && b != null) {
    // swap if out of order, so that a < b.  this is just a convenience for
    // callers, and doesn't affect the properties of the generated key.
    if (a > b) {
      const temp = a;
      a = b;
      b = temp;
    }
  }

  if (a == null) {
    if (b == null) {
      // the shortest positive head: "a" by default, else the first character of
      // the second half of intDigits.
      const head =
        intDigits === undefined ? "a" : intDigits[intDigits.length / 2];
      return head + digits[0];
    }

    const ib = getIntegerPart(b, intDigits);
    const fb = b.slice(ib.length);
    if (isSmallestInteger(ib, digits, intDigits)) {
      return ib + midpoint("", fb, digits);
    }
    if (ib < b) {
      return ib;
    }
    const res = decrementInteger(ib, digits, intDigits);
    if (res == null) {
      throw new Error("cannot decrement any more");
    }
    return res;
  }

  if (b == null) {
    const ia = getIntegerPart(a, intDigits);
    const fa = a.slice(ia.length);
    const i = incrementInteger(ia, digits, intDigits);
    return i == null ? ia + midpoint(fa, null, digits) : i;
  }

  const ia = getIntegerPart(a, intDigits);
  const fa = a.slice(ia.length);
  const ib = getIntegerPart(b, intDigits);
  const fb = b.slice(ib.length);
  if (ia === ib) {
    return ia + midpoint(fa, fb, digits);
  }
  const i = incrementInteger(ia, digits, intDigits);
  if (i == null) {
    throw new Error("cannot increment any more");
  }
  if (i < b) {
    return i;
  }
  return ia + midpoint(fa, null, digits);
}

/**
 * same preconditions as generateKeysBetween.
 * n >= 0.
 * Returns an array of n distinct keys in sorted order.
 * If a and b are both null, returns [a0, a1, ...]
 * If one or the other is null, returns consecutive "integer"
 * keys.  Otherwise, returns relatively short keys between
 * a and b.
 * @param {string | null | undefined} a
 * @param {string | null | undefined} b
 * @param {number} n
 * @param {string} digits
 * @param {string | undefined} intDigits
 * @return {string[]}
 */
export function generateNKeysBetween(
  a,
  b,
  n,
  digits = BASE_62_DIGITS,
  intDigits = undefined
) {
  if (n === 0) {
    return [];
  }
  if (n === 1) {
    return [generateKeyBetween(a, b, digits, intDigits)];
  }
  if (b == null) {
    let c = generateKeyBetween(a, b, digits, intDigits);
    const result = [c];
    for (let i = 0; i < n - 1; i++) {
      c = generateKeyBetween(c, b, digits, intDigits);
      result.push(c);
    }
    return result;
  }
  if (a == null) {
    let c = generateKeyBetween(a, b, digits, intDigits);
    const result = [c];
    for (let i = 0; i < n - 1; i++) {
      c = generateKeyBetween(a, c, digits, intDigits);
      result.push(c);
    }
    result.reverse();
    return result;
  }
  const mid = Math.floor(n / 2);
  const c = generateKeyBetween(a, b, digits, intDigits);
  return [
    ...generateNKeysBetween(a, c, mid, digits, intDigits),
    c,
    ...generateNKeysBetween(c, b, n - mid - 1, digits, intDigits),
  ];
}
