/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {sum} from '@shared/lib/array_utils';

import {iterForDepths} from '@src/lib/iter';

export enum Operator {
  Add = 1,
  Multiply = 2,
  Substract = 3,
  Divide = 4,
  Modulo = 5,
  Exponent = 6,
}

export const OPERATOR_METADATA: Record<
  Operator,
  {op: Operator; label: string; fn: (a: number, b: number) => number; ordered: boolean}
> = {
  [Operator.Add]: {op: Operator.Add, label: '+', fn: (a, b) => trim(a + b), ordered: false},
  [Operator.Multiply]: {
    op: Operator.Multiply,
    label: '*',
    fn: (a, b) => trim(a * b),
    ordered: false,
  },
  [Operator.Substract]: {
    op: Operator.Substract,
    label: '-',
    fn: (a, b) => trim(a - b),
    ordered: true,
  },
  [Operator.Divide]: {
    op: Operator.Divide,
    label: '/',
    fn: (a, b) => trim(Math.floor(a / b)),
    ordered: true,
  },
  [Operator.Modulo]: {op: Operator.Modulo, label: '%', fn: (a, b) => a % b, ordered: true},
  [Operator.Exponent]: {
    op: Operator.Exponent,
    label: '^',
    fn: (a, b) => trim(a ** b),
    ordered: true,
  },
};
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
const MAX_VALUE = 2 ** 31 - 1;
const trim = (val: number): number => (val > MAX_VALUE ? -1 : val);

type RawExp = [number, Operator, number];
export type Combi = {depth: number; histories?: Record<string, RawExp>}[];

export type Expression =
  | {
      val1: Expression;
      op: Operator;
      val2: Expression;
    }
  | number;

interface Options {
  target: number;
  values: number[];
  operators: Operator[];
  onSolution: (sol: {target: number; combi: Combi}) => void;
  onComplete: () => void;
  onProgress: (progress: SearchProgress) => void;
  onCancel: () => void;
}

export interface SearchProgress {
  currentDepth: number;
  iterations: number;
  maxIterations: number;
}

export function findBest(opts: Options): {cancel: () => void; start: () => void} {
  const {target, values, operators, onSolution, onComplete, onProgress, onCancel} = opts;
  const combi: Combi = [];
  for (const v of values) {
    combi[v] = {depth: 0};
  }
  const availableOperators = operators.map(op => OPERATOR_METADATA[op]);

  let iterations = 0;
  let maxIterations = 0;
  let found = false;
  let currentDepth = 1;
  function availableValues(lowerThan: number): Record<number, number[]> {
    const all: Record<number, number[]> = {};
    for (const [str, {depth}] of Object.entries(combi)) {
      const v = parseFloat(str);
      if (v > lowerThan) {
        continue;
      }
      const curr = all[depth];
      if (curr === undefined) {
        all[depth] = [v];
      } else {
        curr.push(v);
      }
    }
    return all;
  }
  function availableDepthPairs(): [number, number][] {
    const pairs: [number, number][] = [];
    for (let d1 = 0; d1 <= currentDepth; d1++) {
      for (let d2 = 0; d2 <= currentDepth; d2++) {
        if (d1 + d2 + 1 === currentDepth) {
          pairs.push([d1, d2]);
        }
      }
    }
    return pairs;
  }
  function getIterator(): Generator<[number, number]> {
    const depthPairs = availableDepthPairs();
    const searchSpace = availableValues(target);
    maxIterations =
      operators.length *
      sum(
        depthPairs.map(
          ([d1, d2]) => (searchSpace[d1]?.length ?? 0) * (searchSpace[d2]?.length ?? 0)
        )
      );
    iterations = 0;
    onProgress({currentDepth, iterations, maxIterations});
    return iterForDepths(depthPairs, searchSpace);
  }
  let iterator = getIterator();

  let shouldStop = false;
  const cancel = (): void => {
    shouldStop = true;
  };

  const LOOP_DURATION_MS = 40;

  function loop(): void {
    const start = Date.now();
    if (shouldStop) {
      onCancel();
      return;
    }
    while (true) {
      const nextVal = iterator.next();
      if (nextVal.done) {
        if (found) {
          onComplete();
          return;
        }
        currentDepth += 1;
        iterator = getIterator();
        continue;
      }
      const [val1, val2] = nextVal.value;
      for (const op of availableOperators) {
        iterations++;
        const newValue = op.fn(val1, val2);
        if (newValue <= 0) {
          continue;
        }
        const sortedVal = (op.ordered ? [val1, val2] : [val1, val2].sort((a, b) => a - b)) as [
          number,
          number,
        ];
        const hKey = `${sortedVal[0]}${op.label}${sortedVal[1]}`;
        const h = [sortedVal[0], op.op, sortedVal[1]] as RawExp;
        const newDepth = combi[val1]!.depth + combi[val2]!.depth + 1;
        const current = combi[newValue];
        if (current === undefined) {
          combi[newValue] = {
            depth: newDepth,
            histories: {[hKey]: h},
          };
        }

        if (current !== undefined) {
          // Skip
          if (newDepth > current.depth) {
            continue;
          }
          if (newDepth < current.depth) {
            current.depth = newDepth;
            current.histories = {[hKey]: h};
          } else if (!current.histories) {
            current.histories = {[hKey]: h};
          } else if (!(hKey in current.histories)) {
            current.histories[hKey] = h;
          }
        }

        if (newValue === target) {
          found = true;
          onSolution({target, combi});
        }
      }
      if (Date.now() - start >= LOOP_DURATION_MS) {
        onProgress({currentDepth, iterations, maxIterations});
        setTimeout(loop, 0);
        return;
      }
    }
  }

  const start = (): void => {
    setTimeout(loop, 0);
  };

  return {cancel, start};
}

export function generateExpressions(combi: Combi, val: number): Expression[] {
  const valInfo = combi[val];
  if (valInfo?.histories === undefined) {
    return [val];
  }
  return Object.values(valInfo.histories).flatMap(h => {
    const [hVal1, op, hVal2] = h;
    const res: Expression[] = [];
    for (const val1 of generateExpressions(combi, hVal1)) {
      for (const val2 of generateExpressions(combi, hVal2)) {
        res.push({val1, op, val2});
      }
    }
    return res;
  });
}

export function cloneExpression(exp: Expression): Expression {
  if (typeof exp === 'number') {
    return exp;
  }
  return {
    val1: cloneExpression(exp.val1),
    op: exp.op,
    val2: cloneExpression(exp.val2),
  };
}

/* eslint-enable @typescript-eslint/no-non-null-assertion */
