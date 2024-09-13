import {FormEventHandler, useCallback, useState} from 'react';
import {styled} from 'styled-components';

import {min, sum, zip} from '@shared/lib/array_utils';
import {randomStringUnsafe} from '@shared/lib/random_utils';
import {removeUndefined} from '@shared/lib/type_utils';

import {Button} from '@shared-web/components/core/button';
import {Input} from '@shared-web/components/core/input';
import {useLocalStorage} from '@shared-web/lib/use_local_storage';

import {History, HistoryItem} from '@src/components/history';
import {Tile} from '@src/components/tile';
import {
  Combi,
  Expression,
  findBest,
  generateExpressions,
  Operator,
  OPERATOR_METADATA,
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

export function sortExpression(exp1: Expression, exp2: Expression): number {
  if (typeof exp1 === 'number' || typeof exp2 === 'number') {
    return typeof exp1 === 'number' ? -1 : 1;
  }

  // Minimize ops
  const count1: ExpressionCount = {numbers: {}, ops: 0};
  const count2: ExpressionCount = {numbers: {}, ops: 0};
  countExpression(exp1, count1);
  countExpression(exp2, count2);
  if (count1.ops !== count2.ops) {
    return count1.ops - count2.ops;
  }

  // Minimize max duplicated numbers
  const max1 = Math.max(...Object.values(count1.numbers));
  const max2 = Math.max(...Object.values(count2.numbers));
  if (max1 !== max2) {
    return max1 - max2;
  }

  // Minimize number of duplicated numbers
  const maxCount1 = Object.values(count1.numbers).filter(c => c === max1).length;
  const maxCount2 = Object.values(count2.numbers).filter(c => c === max2).length;
  if (maxCount1 !== maxCount2) {
    return maxCount1 - maxCount2;
  }

  // Minimize largest number
  const nums1 = Object.keys(count1.numbers)
    .map(c => parseFloat(c))
    .sort((a, b) => b - a);
  const nums2 = Object.keys(count2.numbers)
    .map(c => parseFloat(c))
    .sort((a, b) => b - a);
  for (const [n1, n2] of zip(nums1, nums2)) {
    if (n1 !== n2) {
      return n1 - n2;
    }
  }

  return 0;
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

function bestExpressions(
  solution: {target: number; combi: Combi} | undefined
): Expression[] | undefined {
  if (solution === undefined) {
    return undefined;
  }
  // Generation
  const solutions = generateExpressions(solution.combi, solution.target);
  // Dedup
  const deduped = [...new Map(solutions.map(s => [expressionAsString(s), s] as const)).values()];
  // Sorting
  const withScore = deduped.map(s => ({exp: s, score: scoreExpression(s)}));
  const bestScore = min(withScore, s => s.score);
  // Filtering
  return withScore
    .filter(s => s.score === bestScore)
    .map(s => s.exp)
    .slice(0, 10);
}

export const HomePage: React.FC = () => {
  const [value, setValue] = useState<number>();
  const [cancelFn, setCancelFn] = useState<{fn: () => void}>();
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('history', []);

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
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      const historyId = randomStringUnsafe(8);
      setHistory(h => [
        ...h,
        {
          id: historyId,
          target: value,
          date: Date.now(),
          progress: undefined,
          exp: undefined,
        },
      ]);
      const ret = findBest({
        target: value,
        operators: [Operator.Add, Operator.Substract, Operator.Multiply, Operator.Exponent],
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
        onComplete: () => {
          setCancelFn(undefined);
          setHistory(history =>
            history.map(h =>
              h.id === historyId ? {...h, date: Date.now(), progress: undefined} : h
            )
          );
        },
        onSolution: sol => {
          setHistory(history =>
            history.map(h =>
              h.id === historyId ? {...h, date: Date.now(), exp: bestExpressions(sol)} : h
            )
          );
        },
        onCancel: () => {
          setCancelFn(undefined);
          setHistory(history =>
            removeUndefined(
              history.map(h =>
                h.id === historyId
                  ? h.exp
                    ? {...h, date: Date.now(), canceled: true}
                    : undefined
                  : h
              )
            )
          );
        },
        onProgress: progress => {
          setHistory(history =>
            history.map(h => (h.id === historyId ? {...h, date: Date.now(), progress} : h))
          );
        },
      });
      setCancelFn({fn: ret.cancel});
      ret.start();
    },
    [cancelFn, setHistory, value]
  );

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
            width={'100%'}
          />

          {cancelFn ? (
            <Button expand onClick={cancelFn.fn}>
              Cancel
            </Button>
          ) : (
            <Button expand type="submit" disabled={value === undefined}>
              {`SEARCH`}
            </Button>
          )}
        </Form>
      </Tile>
      {history
        .sort((h1, h2) => h2.date - h1.date)
        .map(h => (
          <History key={h.id} historyId={h.id} />
        ))}
    </Wrapper>
  );
};
HomePage.displayName = 'HomePage';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 16px;
  padding: 16px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
`;
