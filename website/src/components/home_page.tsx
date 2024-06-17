import {FormEventHandler, useCallback, useMemo, useState} from 'react';
import {styled} from 'styled-components';

import {min, sum} from '@shared/lib/array_utils';

import {Button} from '@shared-web/components/core/button';
import {Input} from '@shared-web/components/core/input';

import {ExpressionView} from '@src/components/expression';
import {Tile} from '@src/components/tile';
import {
  Combi,
  Expression,
  findBest,
  generateExpressions,
  Operator,
  OPERATOR_METADATA,
  SearchProgress,
} from '@src/lib/engine';

function asString(num: number | undefined): string {
  return num === undefined ? '' : String(num);
}
function fromString(str: string): number | undefined {
  const num = parseFloat(str);
  return isNaN(num) ? undefined : num;
}

interface ExpressionCount {
  numbers: Record<number, number>;
  ops: number;
}
function countExpression(exp: Expression, count: ExpressionCount): void {
  if (typeof exp === 'number') {
    count.numbers[exp] = (count.numbers[exp] ?? 0) + 1;
  } else {
    count.ops++;
    countExpression(exp.val1, count);
    countExpression(exp.val2, count);
  }
}
function scoreExpression(exp: Expression): number {
  const count: ExpressionCount = {numbers: {}, ops: 0};
  countExpression(exp, count);
  return sum(Object.values(count.numbers).map(c => 100 ** c)) ** count.ops;
}
function expressionAsString(exp: Expression): string {
  if (typeof exp === 'number') {
    return String(exp);
  }
  const op = OPERATOR_METADATA[exp.op];
  const val1Str = expressionAsString(exp.val1);
  const val2Str = expressionAsString(exp.val2);
  const [val1, val2] = op.ordered ? [val1Str, val2Str] : [val1Str, val2Str].sort();
  return `(${val1}${op.label}${val2})`;
}

export const HomePage: React.FC = () => {
  const [value, setValue] = useState<number>();
  const [solution, setSolution] = useState<{target: number; combi: Combi}>();
  const [progress, setProgress] = useState<SearchProgress>();
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
          setProgress(undefined);
        },
        onSolution: setSolution,
        onCancel: () => {
          setCancelFn(undefined);
          setProgress(undefined);
        },
        onProgress: setProgress,
      });
      setCancelFn({fn: ret.cancel});
      setSolution(undefined);
      ret.start();
    },
    [cancelFn, value]
  );

  const bestSolutions = useMemo(() => {
    if (solution === undefined) {
      return undefined;
    }
    // Generation
    const solutions = generateExpressions(solution.combi, solution.target);
    // Dedup
    const deduped = [...new Map(solutions.map(s => [expressionAsString(s), s] as const)).values()];
    // Scoring
    const withScore = deduped.map(s => ({exp: s, score: scoreExpression(s)}));
    const bestScore = min(withScore, s => s.score);

    return withScore.filter(s => s.score === bestScore);
  }, [solution]);

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

          {progress !== undefined ? (
            <div>{`Searching... (depth ${
              progress.currentDepth
            }, it. ${progress.iterations.toLocaleString()}, ${(
              Math.floor((100 * 100 * progress.iterations) / progress.maxIterations) / 100
            ).toLocaleString(undefined, {minimumFractionDigits: 2})}%`}</div>
          ) : (
            <></>
          )}

          {bestSolutions !== undefined && solution ? (
            bestSolutions
              .slice(0, 10)
              .map(s => (
                <ExpressionView
                  key={JSON.stringify(s)}
                  target={solution.target}
                  expression={s.exp}
                />
              ))
          ) : (
            <></>
          )}
          {bestSolutions && bestSolutions.length > 10 ? (
            <HiddenMessage>{`Showing 10 out of ${bestSolutions.length.toLocaleString()}`}</HiddenMessage>
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

const HiddenMessage = styled.div`
  font-style: italic;
  color: #888;
  text-align: center;
`;
