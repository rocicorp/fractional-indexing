# Fractional Indexing

This is based on [Implementing Fractional Indexing
](https://observablehq.com/@dgreensp/implementing-fractional-indexing) by [David Greenspan
](https://github.com/dgreensp).

Fractional indexing is a technique to create an ordering that can be used for [Realtime Editing of Ordered Sequences](https://www.figma.com/blog/realtime-editing-of-ordered-sequences/).

This implementation includes variable-length integers, and the prepend/append optimization described in David's article.

## API

### `generateKeyBetween`

Generate a single key in between two points.

```ts
generateKeyBetween(
  a: string | null | undefined, // start
  b: string | null | undefined, // end
  digits?: string, // digit alphabet, defaults to BASE_62_DIGITS (0-9A-Za-z)
  intDigits?: string, // integer-head alphabet, defaults to `digits`
): string;
```

```ts
import { generateKeyBetween } from 'fractional-indexing';

const first = generateKeyBetween(null, null); // "a0"

// Insert after 1st
const second = generateKeyBetween(first, null); // "a1"

// Insert after 2nd
const third = generateKeyBetween(second, null); // "a2"

// Insert before 1st
const zeroth = generateKeyBetween(null, first); // "Zz"

// Insert in between 2nd and 3rd (midpoint)
const secondAndHalf = generateKeyBetween(second, third); // "a1V"
```

### `generateNKeysBetween`

Use this when generating multiple keys at some known position, as it spaces out indexes more evenly and leads to shorter keys.

```ts
generateNKeysBetween(
  a: string | null | undefined, // start
  b: string | null | undefined, // end
  n: number, // number of keys to generate evenly between start and end
  digits?: string, // digit alphabet, defaults to BASE_62_DIGITS (0-9A-Za-z)
  intDigits?: string, // integer-head alphabet, defaults to `digits`
): string[];
```

```ts
import { generateNKeysBetween } from 'fractional-indexing';

const first = generateNKeysBetween(null, null, 2); // ['a0', 'a1']

// Insert two keys after 2nd
generateNKeysBetween(first[1], null, 2); // ['a2', 'a3']

// Insert two keys before 1st
generateNKeysBetween(null, first[0], 2); // ['Zy', 'Zz']

// Insert two keys in between 1st and 2nd (midpoints)
generateNKeysBetween(second, third, 2); // ['a0G', 'a0V']
```

## Custom digits (alphabets)

Both `generateKeyBetween` and `generateNKeysBetween` accept an optional `digits`
string that defines the alphabet used for the digit values of a key. It defaults
to `BASE_62_DIGITS` (`0-9A-Za-z`). You can pass any alphabet, for example
base&nbsp;10:

```js
import { generateNKeysBetween } from "fractional-indexing";

generateNKeysBetween(null, null, 4, "0123456789"); // ["50", "51", "52", "53"]
```

`digits` must obey two rules:

1. **`digits` must be single-byte and sorted in ascending character-code
   order**, with no duplicates. Every character must have a char code in the
   range 0-255 (so plain ASCII or Latin-1, but not multi-byte scripts). The
   generated keys sort correctly using ordinary lexicographic comparison
   _because_ the digits do. Both rules are validated and throw on violation.

2. **The alphabet may be anything that obeys rule 1** — it does not need to
   include the characters `0-9`, `A-Z`, or `a-z`. Obscure single-byte alphabets
   (symbols, Latin-1, etc.) work fine as long as they are sorted by character
   code. Multi-byte alphabets (e.g. Greek) are rejected.

### Integer heads and `intDigits`

The integer part of every key begins with a magnitude/length marker — a
**head** — drawn from the `intDigits` alphabet. `intDigits` is split in half:
the first half are the negative-length heads and the second half the
positive-length heads, so it must have an **even length**. The head only ever
occupies the first position and is only compared against other heads, which is
why `digits` and `intDigits` may overlap (or be identical) and keys still sort
correctly.

`intDigits` **defaults to `digits`**, so a custom alphabet is _self-headed_: a
base-10 key looks like `"50"`, `"600"`, or `"49"`, with no Latin letters.

When you omit `digits` entirely, `intDigits` falls back to `BASE_52_DIGITS`
(`A-Z` for negative lengths, `a-z` for positive), so the default keys look like
`"a0"`, `"b00"`, or `"Z9"` — the classic format, byte-compatible with the other
implementations listed below. Note that passing `digits` _explicitly_ (even
`BASE_62_DIGITS`) makes the keys self-headed; only omitting `digits` yields the
`A-Z`/`a-z` heads.

To use a custom `digits` but keep the classic Latin heads — or to use an
**odd-length** `digits`, which can't supply its own even head alphabet — pass
`intDigits` explicitly:

```js
import { generateNKeysBetween, BASE_52_DIGITS } from "fractional-indexing";

// self-headed (intDigits defaults to digits):
generateNKeysBetween(null, null, 4, "0123456789"); // ["50", "51", "52", "53"]

// Latin heads (intDigits set explicitly):
generateNKeysBetween(null, null, 4, "0123456789", BASE_52_DIGITS); // ["a0", "a1", "a2", "a3"]
```

## Sorting

The indexes generated by this library are case-sensitive. While [`Array.prototype.sort`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) will [work out of the box](https://github.com/rocicorp/fractional-indexing/issues/19), note that [`String.prototype.localCompare`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare) works case-insensitively and will [give an incorrect ordering](https://github.com/rocicorp/fractional-indexing/issues/20) if used as a sort predicate. Instead, use native string comparison:

```js
const arr = [
  {
    id: "todo_1253241",
    content: "Read the docs",
    fractionalIndex: "YzZ"
  },
  {
    id: "todo_8973942",
    content: "Open a PR",
    fractionalIndex: "Yza" 
  }
]
const sorted = arr.toSorted((a, b) =>
  a.fractionalIndex < b.fractionalIndex
    ? -1
    : a.fractionalIndex > b.fractionalIndex
      ? 1
      : 0,
);
```

## Other Implementations

### Languages

These libraries should be byte-for-byte compatible.

| Language | Repo                                                  |
| -------- | ----------------------------------------------------- |
| Go       | https://github.com/rocicorp/fracdex                   |
| Python   | https://github.com/httpie/fractional-indexing-python  |
| Kotlin   | https://github.com/darvelo/fractional-indexing-kotlin |
| Ruby     | https://github.com/kazu-2020/fractional_indexer       |

### Random Jitter

To minimize the likelihood of index collisions when generating fractional indexes concurrently, [random jitter](https://madebyevan.com/algos/crdt-fractional-indexing/) can be added to the generated indices. These libraries extend this package's functionality with random jitter.

| Language   | Repo                                                         |
| ---------- | ------------------------------------------------------------ |
| TypeScript | https://github.com/nathanhleung/jittered-fractional-indexing |

<!-- TEST -->
