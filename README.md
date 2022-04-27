# Fractional Indexing

This is based on [Implementing Fractional Indexing
](https://observablehq.com/@dgreensp/implementing-fractional-indexing) by [David Greenspan
](https://github.com/dgreensp).

Fractional indexing is a technique to create an ordering that can be used for [Realtime Editing of Ordered Sequences](https://www.figma.com/blog/realtime-editing-of-ordered-sequences/).

This implementation includes variable-length integers, and the prepend/append optimization described in David's article.

## Usage

```js
import { generateKeyBetween } from 'fractional-indexing';

const first = generateKeyBetween(null, null); // "a0"

// Insert after 1st
const second = generateKeyBetween(first, null); // "a1"

// Insert after 2nd
const third = generateKeyBetween(second, null); // "a2"

// Insert before 1st
const zeroth = generateKeyBetween(null, first); // "Zz"

// Insert in between 2nd and 3rd. Midpoint
const secondAndHalf = generateKeyBetween(second, third); // "a1V"
```

## Other Languages

These should be byte-for-byte compatible.

| Language | Repo                                                 |
| -------- | ---------------------------------------------------- |
| Go       | https://github.com/rocicorp/fracdex                  |
| Python   | https://github.com/httpie/fractional-indexing-python |
