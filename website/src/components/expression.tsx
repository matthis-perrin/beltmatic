import {FC, useMemo} from 'react';
import {styled} from 'styled-components';

import {Expression, Operator, OPERATOR_METADATA} from '@src/lib/engine';

interface ExpressionProps {
  expression: Expression;
  target?: number;
}

export const ExpressionView: FC<ExpressionProps> = props => {
  const {target, expression} = props;
  const parenthesis = useMemo(() => {
    if (typeof expression === 'number') {
      return false;
    }
    return expression.op === Operator.Add || expression.op === Operator.Substract;
  }, [expression]);
  if (typeof expression === 'number') {
    return <span>{expression.toLocaleString()}</span>;
  }
  return (
    <Wrapper1>
      {target !== undefined ? <Target>{`${target.toLocaleString()} = `}</Target> : <></>}
      {parenthesis ? <span>&#40;</span> : <></>}
      <Wrapper2>
        <ExpressionView expression={expression.val1} />
        <span>{OPERATOR_METADATA[expression.op].label}</span>
        <ExpressionView expression={expression.val2} />
      </Wrapper2>
      {parenthesis ? <span>&#41;</span> : <></>}
    </Wrapper1>
  );
};

ExpressionView.displayName = 'ExpressionView';

const Wrapper1 = styled.div`
  display: flex;
  align-items: baseline;
`;
const Wrapper2 = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
`;

const Target = styled.div`
  margin-right: 4px;
`;
