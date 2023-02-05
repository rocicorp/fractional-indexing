import { generateKeyBetween, generateNKeysBetween } from "./index.js";

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
  } catch (exp) {
    act = exp.message;
  }

  console.assert(exp == act, `${exp} == ${act}`);
}

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
test("a1", "a0", "a1 >= a0");

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
  } catch (exp) {
    act = exp.message;
  }

  console.assert(exp == act, `${exp} == ${act}`);
}

testN(null, null, 5, "a0 a1 a2 a3 a4");
testN("a4", null, 10, "a5 a6 a7 a8 a9 b00 b01 b02 b03 b04");
testN(null, "a0", 5, "Z5 Z6 Z7 Z8 Z9");
testN(
  "a0",
  "a2",
  20,
  "a01 a02 a03 a035 a04 a05 a06 a07 a08 a09 a1 a11 a12 a13 a14 a15 a16 a17 a18 a19"
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
    act = generateKeyBetween(a, b, BASE_95_DIGITS);
  } catch (exp) {
    act = exp.message;
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
