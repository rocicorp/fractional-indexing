// License: CC0 (no rights reserved).

// This is based on https://observablehq.com/@dgreensp/implementing-fractional-indexing

export const BASE_62_DIGITS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"; // 0-9 + A-Z + a-z

export const BASE_52_DIGITS = BASE_62_DIGITS.slice(10); // A-Z + a-z

// `intDigits` (the integer-part head alphabet) defaults to `digits`. When
// `digits` is also omitted it falls back to BASE_52_DIGITS -- A-Z (negative
// lengths) followed by a-z (positive lengths) -- so the default keys keep the
// classic "a0", "Zz", ... form.

/**
 * Per-alphabet cache mapping each digit's char code to its index, so digit->value
 * lookups are a single typed-array load instead of O(alphabet) String.indexOf.
 * Keys (and therefore alphabets) are required to be single-byte (char code
 * 0-255), so a fixed 256-entry table covers every possible char code.
 * @type {Map<string, Uint8Array>}
 */
const digitIndexCache = new Map();

/**
 * @param {string} digits
 * @return {Uint8Array}
 */
function getDigitIndex(digits) {
  let m = digitIndexCache.get(digits);
  if (m === undefined) {
    m = new Uint8Array(256);
    for (let i = 0; i < digits.length; i++) {
      m[digits.charCodeAt(i)] = i;
    }
    digitIndexCache.set(digits, m);
  }
  return m;
}

// `a` may be empty string, `b` is null or non-empty string.
// `a < b` lexicographically if `b` is non-null.
// no trailing zeros allowed.
// digits is a string such as '0123456789' for base 10.  Digits must be in
// ascending character code order!
/**
 * @param {string} a
 * @param {string | null | undefined} b
 * @param {string} digits
 * @param {Uint8Array} lookup
 * @returns {string}
 */
function midpoint(a, b, digits, lookup) {
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
      return b.slice(0, n) + midpoint(a.slice(n), b.slice(n), digits, lookup);
    }
  }
  // first digits (or lack of digit) are different
  const digitA = a ? /** @type {number} */ (lookup[a.charCodeAt(0)]) : 0;
  const digitB =
    b != null ? /** @type {number} */ (lookup[b.charCodeAt(0)]) : digits.length;
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
      return digits[digitA] + midpoint(a.slice(1), null, digits, lookup);
    }
  }
}

/**
 * @param {string} int
 * @param {string} intDigits
 * @param {Uint8Array} intLookup
 * @return {void}
 */

function validateInteger(int, intDigits, intLookup) {
  if (int.length !== getIntegerLength(int[0], intDigits, intLookup)) {
    throw new Error("invalid integer part of order key: " + int);
  }
}

/**
 * @param {string} head
 * @param {string} intDigits
 * @param {Uint8Array} intLookup
 * @return {number}
 */
function getIntegerLength(head, intDigits, intLookup) {
  // intDigits is a single lexicographically ordered (ascending) alphabet: the
  // first half are the negative-length heads and the second half the
  // positive-length heads (the default A-Z/a-z markers are just one such
  // alphabet). The outermost characters mark the longest integer parts, and the
  // two heads straddling the midpoint mark the shortest (length 2).
  const i = intLookup[head.charCodeAt(0)];
  // `intLookup` returns 0 for any char code not in the alphabet, so confirm the
  // char really is at index `i` before trusting it as a head.
  if (intDigits[i] === head) {
    const half = intDigits.length / 2;
    return i < half ? half - i + 1 : i - half + 2;
  }
  throw new Error("invalid order key head: " + head);
}

/**
 * @param {string} key
 * @param {string} intDigits
 * @param {Uint8Array} intLookup
 * @return {string}
 */

function getIntegerPart(key, intDigits, intLookup) {
  const integerPartLength = getIntegerLength(key[0], intDigits, intLookup);
  if (integerPartLength > key.length) {
    throw new Error("invalid order key: " + key);
  }
  return key.slice(0, integerPartLength);
}

/**
 * @param {string} key
 * @param {string} digits
 * @param {string} intDigits
 * @param {Uint8Array} intLookup
 * @return {void}
 */
function validateOrderKey(key, digits, intDigits, intLookup) {
  if (isSmallestInteger(key, digits, intDigits)) {
    throw new Error("invalid order key: " + key);
  }
  // getIntegerPart will throw if the first character is bad,
  // or the key is too short.  we'd call it to check these things
  // even if we didn't need the result
  const i = getIntegerPart(key, intDigits, intLookup);
  const f = key.slice(i.length);
  if (f.slice(-1) === digits[0]) {
    throw new Error("invalid order key: " + key);
  }
}

// note that this may return null, as there is a largest integer
/**
 * @param {string} x
 * @param {string} digits
 * @param {Uint8Array} lookup
 * @param {string} intDigits
 * @param {Uint8Array} intLookup
 * @return {string | null}
 */
function incrementInteger(x, digits, lookup, intDigits, intLookup) {
  validateInteger(x, intDigits, intLookup);
  const head = x[0];
  const zero = digits[0];
  // Walk the digit run right-to-left, turning maxed-out digits into zeros
  // (`trailing`) until we find one we can bump.
  let trailing = "";
  for (let i = x.length - 1; i >= 1; i--) {
    const d = /** @type {number} */ (lookup[x.charCodeAt(i)]) + 1;
    if (d === digits.length) {
      trailing = zero + trailing;
    } else {
      return head + x.slice(1, i) + digits[d] + trailing;
    }
  }
  // carry out of the whole digit run; `trailing` is now all zeros.
  const headIndex = intLookup[head.charCodeAt(0)];
  if (headIndex === intDigits.length - 1) {
    // already the largest integer
    return null;
  }
  const h = intDigits[headIndex + 1];
  // the head moves one step toward the largest digit; grow or shrink the digit
  // run to match the new head's integer length.
  const lengthDelta =
    getIntegerLength(h, intDigits, intLookup) -
    getIntegerLength(head, intDigits, intLookup);
  return (
    h +
    (lengthDelta > 0
      ? trailing + zero
      : lengthDelta < 0
      ? trailing.slice(1)
      : trailing)
  );
}

// note that this may return null, as there is a smallest integer
/**
 * @param {string} x
 * @param {string} digits
 * @param {Uint8Array} lookup
 * @param {string} intDigits
 * @param {Uint8Array} intLookup
 * @return {string | null}
 */

function decrementInteger(x, digits, lookup, intDigits, intLookup) {
  validateInteger(x, intDigits, intLookup);
  const head = x[0];
  const last = digits[digits.length - 1];
  // Walk the digit run right-to-left, turning underflowed digits into the
  // largest digit (`trailing`) until we find one we can drop.
  let trailing = "";
  for (let i = x.length - 1; i >= 1; i--) {
    const d = /** @type {number} */ (lookup[x.charCodeAt(i)]) - 1;
    if (d === -1) {
      trailing = last + trailing;
    } else {
      return head + x.slice(1, i) + digits[d] + trailing;
    }
  }
  // borrow out of the whole digit run; `trailing` is now all max digits.
  const headIndex = intLookup[head.charCodeAt(0)];
  if (headIndex === 0) {
    // already the smallest integer
    return null;
  }
  const h = intDigits[headIndex - 1];
  // the head moves one step toward the smallest digit; grow or shrink the
  // digit run to match the new head's integer length.
  const lengthDelta =
    getIntegerLength(h, intDigits, intLookup) -
    getIntegerLength(head, intDigits, intLookup);
  return (
    h +
    (lengthDelta > 0
      ? trailing + last
      : lengthDelta < 0
      ? trailing.slice(1)
      : trailing)
  );
}

/**
 * Two-level cache keyed by (intDigits, first digit char code). Nesting the maps
 * lets us look up with the raw `intDigits` string and a primitive char code,
 * avoiding the per-call allocation of a combined string key.
 * @type {Map<string, Map<number, string>>}
 */
const repeatedKeysCache = new Map();

/**
 * @param {string} key
 * @param {string} digits
 * @param {string} intDigits
 */
function isSmallestInteger(key, digits, intDigits) {
  // The smallest integer is the most-negative head (the first character of
  // intDigits, marking the longest integer part) followed by all-zero digits.
  // Use a cache to avoid constructing the same long string over and over which
  // causes unnecessary GC pressure.
  let byDigit = repeatedKeysCache.get(intDigits);
  if (byDigit === undefined) {
    byDigit = new Map();
    repeatedKeysCache.set(intDigits, byDigit);
  }
  const zeroCode = digits.charCodeAt(0);
  let cached = byDigit.get(zeroCode);
  if (cached === undefined) {
    cached = intDigits[0] + digits[0].repeat(intDigits.length / 2);
    byDigit.set(zeroCode, cached);
  }
  return key === cached;
}

/**
 * Returns true if every character of `s` has a strictly greater character code
 * than the one before it (ascending order, which also rules out duplicates).
 * @param {string} s
 * @return {boolean}
 */
function isStrictlyAscending(s) {
  for (let i = 1; i < s.length; i++) {
    if (s.charCodeAt(i - 1) >= s.charCodeAt(i)) {
      return false;
    }
  }
  return true;
}

/**
 * Returns true if every character of `s` is single-byte (char code < 256). Keys
 * are required to be single-byte so digit lookups can use a fixed 256-entry
 * table.
 * @param {string} s
 * @return {boolean}
 */
function isSingleByte(s) {
  for (let i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) > 255) {
      return false;
    }
  }
  return true;
}

/**
 * Alphabets that have already passed `validateDigits`. Validation is pure and
 * its result never changes, so we cache the alphabet to skip re-scanning it on
 * every call. Kept separate from `validatedIntDigits` because the two have
 * different rules (an odd-length string is a valid `digits` but not `intDigits`).
 * @type {Set<string>}
 */
const validatedDigits = new Set();

/**
 * Validates a fractional-digit alphabet: at least two characters, in strictly
 * ascending character-code order.
 * @param {string} digits
 * @return {void}
 */
function validateDigits(digits) {
  if (validatedDigits.has(digits)) {
    return;
  }
  if (digits.length < 2 || !isStrictlyAscending(digits)) {
    throw new Error(
      "digits must be at least 2 characters in strictly ascending character " +
        "code order: " +
        digits
    );
  }
  if (!isSingleByte(digits)) {
    throw new Error("digits must be single-byte (char code 0-255): " + digits);
  }
  validatedDigits.add(digits);
}

/**
 * Alphabets that have already passed `validateIntDigits`.
 * @type {Set<string>}
 */
const validatedIntDigits = new Set();

/**
 * Validates a head-marker alphabet: an even number of at least two characters
 * (its two halves are the negative- and positive-length heads), in strictly
 * ascending character-code order.
 * @param {string} intDigits
 * @return {void}
 */
function validateIntDigits(intDigits) {
  if (validatedIntDigits.has(intDigits)) {
    return;
  }
  if (
    intDigits.length < 2 ||
    intDigits.length % 2 !== 0 ||
    !isStrictlyAscending(intDigits)
  ) {
    throw new Error(
      "intDigits must be an even number of at least 2 characters in strictly " +
        "ascending character code order: " +
        intDigits
    );
  }
  if (!isSingleByte(intDigits)) {
    throw new Error(
      "intDigits must be single-byte (char code 0-255): " + intDigits
    );
  }
  validatedIntDigits.add(intDigits);
}

/**
 * Generates an order key that sorts between `a` and `b`.
 *
 * `a` is the lower bound: an order key, or null for the start.
 * `b` is the upper bound: an order key, or null for the end.
 * When both are non-null, they may be passed in either order.
 *
 * `digits` is the alphabet, e.g. '0123456789' for base 10. Its characters
 * must be single-byte (char code 0-255) and in ascending character code order;
 * both are validated. It may otherwise be any alphabet (it does not need to
 * contain 0-9, A-Z or a-z). Because `intDigits` defaults to `digits`, an
 * odd-length `digits` must be paired with an explicit even-length `intDigits`.
 *
 * Note that `digits` only defines the *digit values* of a key. The integer
 * part of every key also begins with a length/magnitude marker (a "head") drawn
 * from the `intDigits` alphabet. The head only ever occupies the first position
 * and is only compared against other heads, which is why `digits` and
 * `intDigits` may overlap (or be identical) and keys still sort correctly.
 *
 * `intDigits` is the head alphabet: a single alphabet in ascending
 * (lexicographical) character order, with even length. Its first half are the
 * negative-length heads and its second half the positive-length heads. The
 * outermost characters mark the longest integer parts and the two characters
 * straddling the midpoint mark the shortest (length 2). The integer part may
 * grow until it reaches the outermost heads, so a shorter alphabet limits how
 * large/small a key's integer part can become.
 *
 * `intDigits` defaults to `digits`, so a base-10 alphabet produces self-headed
 * keys like "50", "600" or "49". When `digits` is also omitted it falls back to
 * BASE_52_DIGITS (A-Z/a-z), giving the classic "a0", "b00", "Z9" form. Note that
 * passing `digits` explicitly (even BASE_62_DIGITS) makes the keys self-headed;
 * only omitting `digits` entirely yields the A-Z/a-z heads.
 *
 * @example
 * // base 10: heads come from `digits` itself. The first half (0-4) are negative
 * // heads, the second half (5-9) positive heads, and 4/5 mark the shortest
 * // (length-2) integer parts.
 * generateKeyBetween(null, null, "0123456789"); // => "50"
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
  digits = undefined,
  intDigits = undefined
) {
  if (intDigits !== undefined) {
    validateIntDigits(intDigits);
  } else {
    intDigits = digits ?? BASE_52_DIGITS;
  }
  if (digits !== undefined) {
    validateDigits(digits);
  } else {
    digits = BASE_62_DIGITS;
  }

  const lookup = getDigitIndex(digits);
  const intLookup = getDigitIndex(intDigits);
  if (a != null) {
    validateOrderKey(a, digits, intDigits, intLookup);
  }
  if (b != null) {
    validateOrderKey(b, digits, intDigits, intLookup);
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
      // the shortest positive head: the first character of the second half of
      // intDigits ("a" for the default A-Z/a-z markers).
      const head = intDigits[intDigits.length / 2];
      return head + digits[0];
    }

    const ib = getIntegerPart(b, intDigits, intLookup);
    const fb = b.slice(ib.length);
    if (isSmallestInteger(ib, digits, intDigits)) {
      return ib + midpoint("", fb, digits, lookup);
    }
    if (ib < b) {
      return ib;
    }
    const res = decrementInteger(ib, digits, lookup, intDigits, intLookup);
    if (res == null) {
      throw new Error("cannot decrement any more");
    }
    return res;
  }

  if (b == null) {
    const ia = getIntegerPart(a, intDigits, intLookup);
    const fa = a.slice(ia.length);
    const i = incrementInteger(ia, digits, lookup, intDigits, intLookup);
    return i == null ? ia + midpoint(fa, null, digits, lookup) : i;
  }

  const ia = getIntegerPart(a, intDigits, intLookup);
  const fa = a.slice(ia.length);
  const ib = getIntegerPart(b, intDigits, intLookup);
  const fb = b.slice(ib.length);
  if (ia === ib) {
    return ia + midpoint(fa, fb, digits, lookup);
  }
  const i = incrementInteger(ia, digits, lookup, intDigits, intLookup);
  if (i == null) {
    throw new Error("cannot increment any more");
  }
  if (i < b) {
    return i;
  }
  return ia + midpoint(fa, null, digits, lookup);
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
 * @param {string=} digits
 * @param {string=} intDigits
 * @return {string[]}
 */
export function generateNKeysBetween(
  a,
  b,
  n,
  digits = undefined,
  intDigits = undefined
) {
  if (intDigits !== undefined) {
    validateIntDigits(intDigits);
  } else {
    intDigits = digits ?? BASE_52_DIGITS;
  }
  if (digits !== undefined) {
    validateDigits(digits);
  } else {
    digits = BASE_62_DIGITS;
  }

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
