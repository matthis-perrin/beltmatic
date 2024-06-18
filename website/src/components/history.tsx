import {FC, useCallback, useState} from 'react';
import {styled} from 'styled-components';

import {ExpressionView} from '@src/components/expression';
import {sortExpression} from '@src/components/home_page';
import {Expression, SearchProgress} from '@src/lib/engine';

export interface HistoryItem {
  id: string;
  target: number;
  date: number;
  canceled?: boolean;
  progress?: SearchProgress;
  exp?: Expression[];
}

interface HistoryProps {
  history: HistoryItem;
  startExpanded?: boolean;
}

export const History: FC<HistoryProps> = ({history, startExpanded}) => {
  const {target, progress, exp} = history;
  const [collapsed, setCollapsed] = useState(!startExpanded);

  const handleClick = useCallback(() => {
    setCollapsed(curr => !curr);
  }, []);

  return (
    <Wrapper onClick={handleClick}>
      {progress !== undefined ? (
        <div>{`Searching... (depth ${
          progress.currentDepth
        }, it. ${progress.iterations.toLocaleString()}, ${(
          Math.floor((100 * 100 * progress.iterations) / progress.maxIterations) / 100
        ).toLocaleString(undefined, {minimumFractionDigits: 2})}%`}</div>
      ) : (
        <></>
      )}

      {exp !== undefined ? (
        exp
          .sort(sortExpression)
          .slice(0, collapsed ? 1 : undefined)
          .map(s => <ExpressionView key={JSON.stringify(s)} target={target} expression={s} />)
      ) : (
        <></>
      )}
    </Wrapper>
  );
};

History.displayName = 'History';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
`;
