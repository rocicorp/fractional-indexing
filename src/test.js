import { generateKeyBetween } from "./index.js";

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

  console.assert(exp == act, `${exp} == ${act}`); //"error";
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
