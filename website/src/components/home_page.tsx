import {FormEventHandler, useCallback, useMemo, useState} from 'react';
import {styled} from 'styled-components';

import {max, sum} from '@shared/lib/array_utils';

import {Button} from '@shared-web/components/core/button';
import {Input} from '@shared-web/components/core/input';

import {ExpressionView} from '@src/components/expression';
import {Tile} from '@src/components/tile';
import {Expression, findBest, Operator} from '@src/lib/engine';

function asString(num: number | undefined): string {
  return num === undefined ? '' : String(num);
}
function fromString(str: string): number | undefined {
  const num = parseFloat(str);
  return isNaN(num) ? undefined : num;
}

function mergeCount(
  c1: Record<number, number>,
  c2: Record<number, number>
): Record<number, number> {
  const newCount = {...c1};
  for (const [nStr, c] of Object.entries(c2)) {
    const n = parseFloat(nStr);
    newCount[n] = (newCount[n] ?? 0) + c;
  }
  return newCount;
}
function countExpression(exp: Expression, count: Record<number, number>): Record<number, number> {
  let newCount = {...count};
  if (typeof exp === 'number') {
    newCount[exp] = (newCount[exp] ?? 0) + 1;
  } else {
    const exp1 = countExpression(exp.val1, {});
    const exp2 = countExpression(exp.val2, {});
    newCount = mergeCount(exp1, exp2);
  }
  return newCount;
}
function scoreExpression(exp: Expression): number {
  const count = countExpression(exp, {});
  return sum(Object.values(count).map(c => 100 ** c));
}
function expressionAsString(exp: Expression): string {
  if (typeof exp === 'number') {
    return String(exp);
  }
  const val1Str = String(exp.val1);
  const val2Str = String(exp.val2);
  const [val1, val2] = [val1Str, val2Str].sort();
  return `${val1}${exp.op}${val2}`;
}

export const HomePage: React.FC = () => {
  const [value, setValue] = useState<number>();
  const [solutions, setSolutions] = useState<{target: number; exp: Expression}[]>();
  const [iterations, setIterations] = useState<number>();
  const [maxIterations, setMaxIterations] = useState<number>();
  const [cancelFn, setCancelFn] = useState<{fn: () => void}>();

  const handleSubmit = useCallback<FormEventHandler>(
    evt => {
      evt.preventDefault();
      if (cancelFn !== undefined) {
        cancelFn.fn();
        return;
      }
      if (value === undefined) {
        return;
      }
      const ret = findBest({
        target: value,
        operators: [Operator.Add, Operator.Substract, Operator.Multiply, Operator.Exponent],
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
        onComplete: () => {
          setCancelFn(undefined);
          setIterations(undefined);
        },
        onSolution: solution => {
          setSolutions(solutions => [...(solutions ?? []), solution]);
        },
        onCancel: () => {
          setCancelFn(undefined);
          setIterations(undefined);
        },
        onProgress: (iterations, maxIterations) => {
          setIterations(iterations);
          setMaxIterations(maxIterations);
        },
      });
      setCancelFn({fn: ret.cancel});
      setSolutions(undefined);
      ret.start();
    },
    [cancelFn, value]
  );

  const bestSolutions = useMemo(() => {
    if (solutions === undefined) {
      return undefined;
    }
    // Scoring
    const withScore = solutions.map(s => ({...s, score: scoreExpression(s.exp)}));
    const bestScore = max(withScore, s => s.score);
    // Dedup
    const deduped = [
      ...new Map(withScore.map(s => [expressionAsString(s.exp), s] as const)).values(),
    ];

    return deduped.filter(s => s.score === bestScore);
  }, [solutions]);

  return (
    <Wrapper>
      <Tile>
        <Form onSubmit={handleSubmit}>
          <Input
            value={value}
            syncState={setValue}
            asString={asString}
            fromString={fromString}
            autoFocus
            width={300}
          />

          {cancelFn ? (
            // eslint-disable-next-line react/jsx-handler-names
            <Button expand onClick={cancelFn.fn}>
              Cancel
            </Button>
          ) : (
            <Button expand type="submit" disabled={value === undefined}>
              {`SEARCH`}
            </Button>
          )}

          {iterations !== undefined ? (
            <div>{`Searching... (it. ${iterations.toLocaleString()}${
              maxIterations === undefined
                ? ''
                : ` ${(Math.floor((100 * 100 * iterations) / maxIterations) / 100).toLocaleString(
                    undefined,
                    {minimumFractionDigits: 2}
                  )}%`
            })`}</div>
          ) : (
            <></>
          )}

          {bestSolutions !== undefined ? (
            bestSolutions
              // .sort((s1, s2) => scoreExpression(s1.exp) - scoreExpression(s2.exp))
              .map(solution => (
                <ExpressionView
                  key={JSON.stringify(solution)}
                  target={solution.target}
                  expression={solution.exp}
                />
              ))
          ) : (
            <></>
          )}
        </Form>
      </Tile>
    </Wrapper>
  );
};
HomePage.displayName = 'HomePage';

const Wrapper = styled.div`
  padding: 32px;
  margin: auto;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
`;
