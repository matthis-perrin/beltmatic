/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {iter} from '@src/lib/iter';

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

type Combi = {depth: number; history?: [number, Operator, number]}[];

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
  onSolution: (sol: {target: number; exp: Expression}) => void;
  onComplete: () => void;
  onProgress: (iterations: number, maxIterations?: number) => void;
  onCancel: () => void;
}

export function findBest(opts: Options): {cancel: () => void; start: () => void} {
  const {target, values, operators, onSolution, onComplete, onProgress, onCancel} = opts;
  const combi: Combi = [];
  for (const v of values) {
    combi[v] = {depth: 0};
  }
  const availableOperators = operators.map(op => OPERATOR_METADATA[op]);

  let globalIterations = 0;
  let found = false;
  function availableValues(): number[] {
    const values = Object.entries(combi)
      .sort(([v1, {depth: d1}], [v2, {depth: d2}]) =>
        d1 !== d2 ? d1 - d2 : parseFloat(v1) - parseFloat(v2)
      )
      .map(e => parseFloat(e[0]));
    return values;
  }
  let searchSpace = availableValues();
  let iterator = iter(searchSpace);

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
        searchSpace = availableValues();
        iterator = iter(searchSpace);
        continue;
      }
      const [val1, val2] = nextVal.value;
      for (const op of availableOperators) {
        globalIterations++;
        const newValue = op.fn(val1, val2);
        if (newValue <= 0) {
          continue;
        }
        const newDepth = combi[val1]!.depth + combi[val2]!.depth + 1;
        const current = combi[newValue];
        if (current === undefined) {
          combi[newValue] = {
            depth: newDepth,
            history: [val1, op.op, val2],
          };
        }

        if (current !== undefined) {
          if (newDepth > current.depth) {
            continue;
          }
          current.depth = newDepth;
          current.history = [val1, op.op, val2];
        }

        if (newValue === target && (current === undefined || current.depth >= newDepth)) {
          found = true;
          onSolution({target, exp: cloneExpression(generateExpression(combi, target))});
        }
      }
      if (Date.now() - start >= LOOP_DURATION_MS) {
        onProgress(globalIterations, found ? searchSpace.length ** 2 : undefined);
        setTimeout(loop, 0);
        return;
      }
    }
  }

  const start = (): void => {
    onProgress(0, undefined);
    setTimeout(loop, 0);
  };

  return {cancel, start};
}

function generateExpression(combi: Combi, val: number): Expression {
  const valInfo = combi[val];
  if (valInfo!.history === undefined) {
    return val;
  }
  const [val1, op, val2] = valInfo!.history;
  return {val1: generateExpression(combi, val1), op, val2: generateExpression(combi, val2)};
}

function cloneExpression(exp: Expression): Expression {
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
