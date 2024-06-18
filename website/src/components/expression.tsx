import {FC} from 'react';
import {styled} from 'styled-components';

import {Expression, OPERATOR_METADATA} from '@src/lib/engine';

interface ExpressionProps {
  expression: Expression;
  target?: number;
}

export const ExpressionView: FC<ExpressionProps> = props => {
  const {target, expression} = props;
  if (typeof expression === 'number') {
    return <span>{expression.toLocaleString()}</span>;
  }
  return (
    <Wrapper1>
      {target !== undefined ? <Target>{`${target.toLocaleString()} = `}</Target> : <></>}
      <span>&#40;</span>
      <Wrapper2>
        <ExpressionView expression={expression.val1} />
        <span>{OPERATOR_METADATA[expression.op].label}</span>
        <ExpressionView expression={expression.val2} />
      </Wrapper2>
      <span>&#41;</span>
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
