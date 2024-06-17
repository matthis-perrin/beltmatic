import {styled} from 'styled-components';
import {Route} from 'wouter';

import {Modal} from '@shared-web/components/core/modal';

import {HomePage} from '@src/components/home_page';

export const App: React.FC = () => {
  return (
    <Route path="/" nest>
      <>
        <Wrapper>
          <Route path="/" component={HomePage} />
        </Wrapper>
        <Modal />
      </>
    </Route>
  );
};
App.displayName = 'App';

const Wrapper = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: #ccc;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;
