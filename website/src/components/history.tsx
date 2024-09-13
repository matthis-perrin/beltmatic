import {FC, MouseEventHandler, useCallback, useMemo, useState} from 'react';
import {styled} from 'styled-components';

import {UnthemedButton} from '@shared-web/components/core/button';
import {SvgIcon} from '@shared-web/components/core/svg_icon';
import {trashIcon} from '@shared-web/components/icons/trash_icon';
import {useLocalStorage} from '@shared-web/lib/use_local_storage';

import {ExpressionView} from '@src/components/expression';
import {sortExpression} from '@src/components/home_page';
import {Tile} from '@src/components/tile';
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
  historyId: string;
}

export const History: FC<HistoryProps> = ({historyId}) => {
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('history', []);
  const historyItem = useMemo(() => history.find(h => h.id === historyId), [history, historyId]);
  const [collapsed, setCollapsed] = useState(
    () => history.sort((h1, h2) => h2.date - h1.date)[0]?.id !== historyId
  );

  const handleClick = useCallback(() => {
    setCollapsed(curr => !curr);
  }, []);

  const handleDeleteClick = useCallback<MouseEventHandler>(
    evt => {
      evt.stopPropagation();
      setHistory(h => h.filter(h => h.id !== historyId));
    },
    [historyId, setHistory]
  );

  if (!historyItem) {
    return <></>;
  }
  const {target, progress, exp, canceled} = historyItem;

  return (
    <Wrapper onClick={handleClick}>
      <DeleteButton onClick={handleDeleteClick}>
        <SvgIcon icon={trashIcon} color={'#888'} size={12} />
      </DeleteButton>
      {progress !== undefined && !canceled ? (
        <div>{`Searching... (depth ${
          progress.currentDepth
        }, it. ${progress.iterations.toLocaleString()}, ${(
          Math.floor((100 * 100 * progress.iterations) / progress.maxIterations) / 100
        ).toLocaleString(undefined, {minimumFractionDigits: 2})}%)`}</div>
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

const Wrapper = styled(Tile)`
  position: relative;
  gap: 16px;
  cursor: pointer;
  overflow: hidden;
`;

const DeleteButton = styled(UnthemedButton)`
  position: absolute;
  top: 0;
  right: 0;
  padding: 12px;
  border-bottom-left-radius: 8px;
  &:hover {
    background-color: #ffeaea;
  }
  &:hover > svg {
    fill: #c54747;
  }
`;
