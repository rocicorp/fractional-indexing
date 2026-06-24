import {
  generateKeyBetween,
  generateNKeysBetween,
  BASE_52_DIGITS,
} from "./index.js";

/**
 * @param {string} digits
 * @param {string} intDigits
 * @param {string | null} a
 * @param {string | null} b
 * @param {string} exp
 */
function testIntDigits(digits, intDigits, a, b, exp) {
  /** @type {string} */
  let act;
  try {
    act = generateKeyBetween(a, b, digits, intDigits);
  } catch (e) {
    act = e.message;
  }

  console.assert(exp == act, `${exp} == ${act}`);
}

/**
 * @param {string | null} a
 * @param {string | null} b
 * @param {string} exp
 */
function test(a, b, exp) {
  /** @type {string} */
  let act;
  try {
    act = generateKeyBetween(a, b);
  } catch (e) {
    act = e.message;
  }

  console.assert(exp == act, `${exp} == ${act}`);
}

// With no `digits` and no `intDigits` the default is unchanged: BASE_62 digits
// with the A-Z/a-z head markers, so keys still look like "a0", "Zz", ...
test(null, null, "a0");
test(null, "a0", "Zz");
test(null, "Zz", "Zy");
test("a0", null, "a1");
test("a1", null, "a2");
test("a0", "a1", "a0V");
test("a1", "a2", "a1V");
test("a0V", "a1", "a0l");
test("Zz", "a0", "ZzV");
test("Zz", "a1", "a0");
test(null, "Y00", "Xzzz");
test("bzz", null, "c000");
test("a0", "a0V", "a0G");
test("a0", "a0G", "a08");
test("b125", "b129", "b127");
test("a0", "a1V", "a1");
test("Zz", "a01", "a0");
test(null, "a0V", "a0");
test(null, "b999", "b99");
test(
  null,
  "A00000000000000000000000000",
  "invalid order key: A00000000000000000000000000"
);
test(null, "A000000000000000000000000001", "A000000000000000000000000000V");
test("zzzzzzzzzzzzzzzzzzzzzzzzzzy", null, "zzzzzzzzzzzzzzzzzzzzzzzzzzz");
test("zzzzzzzzzzzzzzzzzzzzzzzzzzz", null, "zzzzzzzzzzzzzzzzzzzzzzzzzzzV");
test("a00", null, "invalid order key: a00");
test("a00", "a1", "invalid order key: a00");
test("0", "1", "invalid order key head: 0");
test("a1", "a0", "a0V");

/**
 * @param {string | null} a
 * @param {string | null} b
 * @param {number} n
 * @param {string} exp
 */
function testN(a, b, n, exp) {
  const BASE_10_DIGITS = "0123456789";

  /** @type {string} */
  let act;
  try {
    act = generateNKeysBetween(a, b, n, BASE_10_DIGITS).join(" ");
  } catch (e) {
    act = e.message;
  }

  console.assert(exp == act, `${exp} == ${act}`);
}

// A custom `digits` with no `intDigits` now uses `digits` itself as the head
// alphabet, so base-10 keys contain no letters: heads 0-4 are negative lengths,
// 5-9 positive, and 4/5 mark the shortest (length-2) integer parts.
testN(null, null, 5, "50 51 52 53 54");
testN("54", null, 10, "55 56 57 58 59 600 601 602 603 604");
testN(null, "50", 5, "45 46 47 48 49");
testN(
  "50",
  "52",
  20,
  "501 502 503 5035 504 505 506 507 508 509 51 511 512 513 514 515 516 517 518 519"
);

/**
 * @param {string | null} a
 * @param {string | null} b
 * @param {string} exp
 */
function testBase95(a, b, exp) {
  const BASE_95_DIGITS =
    " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";

  /** @type {string} */
  let act;
  try {
    // base-95 is odd-length, so it can't supply its own (even) head alphabet;
    // pass the default A-Z/a-z markers explicitly to keep Latin heads.
    act = generateKeyBetween(a, b, BASE_95_DIGITS, BASE_52_DIGITS);
  } catch (e) {
    act = e.message;
  }

  console.assert(exp == act, `${exp} == ${act}`);
}

testBase95("a00", "a01", "a00P");
testBase95("a0/", "a00", "a0/P");
testBase95(null, null, "a ");
testBase95("a ", null, "a!");
testBase95(null, "a ", "Z~");
testBase95("a0 ", "a0!", "invalid order key: a0 ");
testBase95(
  null,
  "A                          0",
  "A                          ("
);
testBase95("a~", null, "b  ");
testBase95("Z~", null, "a ");
testBase95("b   ", null, "invalid order key: b   ");
testBase95("a0", "a0V", "a0;");
testBase95("a  1", "a  2", "a  1P");
testBase95(
  null,
  "A                          ",
  "invalid order key: A                          "
);

// Custom alphabets that do not contain the Latin head characters a-z/A-Z work
// fine, as long as the digits are even-length, single-byte (char code 0-255),
// and sorted in ascending character-code order. With no `intDigits` the digit
// alphabet itself supplies the integer heads, so the generated keys are
// self-headed (no Latin letters).

/**
 * @param {string} digits
 * @param {string | null} a
 * @param {string | null} b
 * @param {number} n
 * @param {string} exp
 */
function testNDigits(digits, a, b, n, exp) {
  /** @type {string} */
  let act;
  try {
    act = generateNKeysBetween(a, b, n, digits).join(" ");
  } catch (e) {
    act = e.message;
  }

  console.assert(exp == act, `${exp} == ${act}`);
}

// Base 2: the integer range is tiny (only heads "0" and "1").
testNDigits(
  "01",
  null,
  null,
  8,
  "10 11 111 1111 11111 111111 1111111 11111111"
);
testNDigits("01", "10", null, 1, "11");
testNDigits("01", "10", "11", 1, "101");

// Keys must be single-byte: a multi-byte alphabet (e.g. Greek, U+0391..) is
// rejected, but Latin-1 characters (char code 128-255) are allowed.
testNDigits(
  "ΑΒΓΔΕΖΗΘ",
  null,
  null,
  10,
  "digits must be single-byte (char code 0-255): ΑΒΓΔΕΖΗΘ"
);
// A Latin-1 alphabet (¡=161 .. ¦=166), all within the single-byte range.
testNDigits("¡¢£¤¥¦", null, null, 6, "¤¡ ¤¢ ¤£ ¤¤ ¤¥ ¤¦");

// An alphabet of symbols whose character codes are all below "A".
testNDigits(" !#$%&", null, null, 6, "$  $! $# $$ $% $&");

// Generated keys must sort with ordinary lexicographic comparison for any
// ascending alphabet.  Insert at random positions and verify ordering holds.
/**
 * @param {string} digits
 * @param {string} [intDigits]
 */
function testOrdering(digits, intDigits) {
  let seed = 1;
  const rnd = () =>
    (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  /** @type {string[]} */
  const list = [];
  for (let i = 0; i < 1000; i++) {
    const pos = Math.floor(rnd() * (list.length + 1));
    const a = pos > 0 ? list[pos - 1] : null;
    const b = pos < list.length ? list[pos] : null;
    const k = generateKeyBetween(a, b, digits, intDigits);
    console.assert(
      (a === null || a < k) && (b === null || k < b),
      `out of range for ${JSON.stringify(digits)}/${JSON.stringify(
        intDigits
      )}: ${a} < ${k} < ${b}`
    );
    list.splice(pos, 0, k);
  }
  const sorted = [...list].sort();
  console.assert(
    sorted.every((v, i) => v === list[i]),
    `not stably sorted for ${JSON.stringify(digits)}/${JSON.stringify(
      intDigits
    )}`
  );
}

// `intDigits` overrides the integer-part head alphabet (which defaults to the
// digit alphabet, or to the A-Z/a-z markers when no `digits` is given).  It is a
// single ascending (lexicographically ordered) alphabet: the first half are the
// negative-length heads and the second half the positive-length heads.  The
// outermost characters mark the longest integer parts and the two heads
// straddling the midpoint mark the shortest (length 2).  Restricting it to a
// shorter alphabet limits how long the integer part may grow, and any head
// outside `intDigits` is invalid.

// Limit negative heads to "A","B" and positive heads to "a","b"; the inner pair
// (B, a) mark length 2 and the outer pair (A, b) mark length 3.
testIntDigits("0123456789", "ABab", "a0", "a1", "a05");
testIntDigits("0123456789", "ABab", "a9", null, "b00");
testIntDigits("0123456789", "ABab", "b00", null, "b01");
testIntDigits("0123456789", "ABab", "a0", null, "a1");
testIntDigits("0123456789", "ABab", null, "B9", "B8");
// A head outside the limited alphabet is rejected.
testIntDigits("0123456789", "ABab", "c00", null, "invalid order key head: c");
testIntDigits("0123456789", "ABab", "00", "01", "invalid order key head: 0");

// An omitted `intDigits` defaults to `digits`, so it must behave identically to
// passing `digits` as the head alphabet.
{
  let seed = 1;
  const rnd = () =>
    (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const digits = "0123456789";
  /** @type {string[]} */
  const list = [];
  for (let i = 0; i < 2000; i++) {
    const pos = Math.floor(rnd() * (list.length + 1));
    const a = pos > 0 ? list[pos - 1] : null;
    const b = pos < list.length ? list[pos] : null;
    const def = generateKeyBetween(a, b, digits);
    const cust = generateKeyBetween(a, b, digits, digits);
    console.assert(
      def === cust,
      `omitted intDigits should match digits: ${a},${b} => ${def} !== ${cust}`
    );
    list.splice(pos, 0, def);
  }
}

// `intDigits` may be identical to `digits` (which is now also the default),
// producing keys with no letters at all: the first half (0-4) are negative heads
// and the second half (5-9) positive heads, so 4 and 5 mark the shortest
// (length-2) integer parts.
testIntDigits("0123456789", "0123456789", null, null, "50");
testIntDigits("0123456789", "0123456789", "50", null, "51");
testIntDigits("0123456789", "0123456789", "59", null, "600");
testIntDigits("0123456789", "0123456789", null, "50", "49");
testIntDigits("0123456789", "0123456789", "56", "57", "565");

// `digits` and `intDigits` are validated once at the start of the public API.
// `digits` must be at least two characters in strictly ascending character-code
// order (which also rules out duplicates).
testIntDigits(
  "0213456789",
  "ABab",
  null,
  null,
  "digits must be at least 2 characters in strictly ascending character code order: 0213456789"
);
testIntDigits(
  "0",
  "ABab",
  null,
  null,
  "digits must be at least 2 characters in strictly ascending character code order: 0"
);
testIntDigits(
  "0012",
  "ABab",
  null,
  null,
  "digits must be at least 2 characters in strictly ascending character code order: 0012"
);
// `intDigits` must additionally be of even length (its two halves are the
// negative- and positive-length heads).
testIntDigits(
  "0123456789",
  "abc",
  null,
  null,
  "intDigits must be an even number of at least 2 characters in strictly ascending character code order: abc"
);
testIntDigits(
  "0123456789",
  "ba",
  null,
  null,
  "intDigits must be an even number of at least 2 characters in strictly ascending character code order: ba"
);
testIntDigits(
  "0123456789",
  "",
  null,
  null,
  "intDigits must be an even number of at least 2 characters in strictly ascending character code order: "
);
// Both alphabets must be single-byte.
testIntDigits(
  "0123456789",
  "ΑΒΓΔ",
  null,
  null,
  "intDigits must be single-byte (char code 0-255): ΑΒΓΔ"
);
// Validation also guards the generateNKeysBetween entry point.
testNDigits(
  "0",
  null,
  null,
  5,
  "digits must be at least 2 characters in strictly ascending character code order: 0"
);

testOrdering("0123456789");
testOrdering(" !#$%&");
testOrdering("¡¢£¤¥¦");
testOrdering("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");
// base 2 self-heading has too small an integer range to sustain 1000 inserts,
// so give it the wider A-Z/a-z head alphabet.
testOrdering("01", BASE_52_DIGITS);
// digits and intDigits identical (base-10 keys with no letters).
testOrdering("0123456789", "0123456789");
