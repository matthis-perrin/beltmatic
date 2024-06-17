import {FC, JSX, MouseEventHandler, useCallback, useMemo} from 'react';
import {styled} from 'styled-components';

import {padNumber} from '@shared/lib/format_utils';
import {asNumber} from '@shared/lib/type_utils';

import {createButton} from '@shared-web/components/core/button';
import {EmptyFragment} from '@shared-web/lib/react';
import {useTheme} from '@shared-web/theme/theme_context';
import {background, borderColor, textColor} from '@shared-web/theme/theme_utils';

interface TimePickerProps {
  header?: JSX.Element | string;
  onClick: (hour: number, minute: number) => void;
  hours?: number[];
  minutes?: number[];
}

function buttonText(hour: number, minute: number): string {
  return `${padNumber(hour, 2)}:${padNumber(minute, 2)}`;
}

const DEFAULT_HOURS = [
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
];

const DEFAULT_MINUTES = [0];

export const TimePicker: FC<TimePickerProps> = props => {
  const {header, onClick, hours = DEFAULT_HOURS, minutes = DEFAULT_MINUTES} = props;
  const {button} = useTheme();

  const handleClick = useCallback<MouseEventHandler>(
    evt => {
      const hour = asNumber(evt.currentTarget.getAttribute('data-hour'), 0);
      const minute = asNumber(evt.currentTarget.getAttribute('data-minute'), 0);
      onClick(hour, minute);
    },
    [onClick]
  );

  const TimeButton = useMemo(() => {
    return createButton({
      type: 'button',
      theme: 'button',
      themeOverrides: {
        paddingTop: 8,
        paddingRight: 10,
        paddingBottom: 8,
        paddingLeft: 10,
        ...background('#00000004'),
        backgroundHover: '#ffffff',
        ...textColor('#444444'),
        textColorHover: button.backgroundActive,
        borderWidth: 2,
        ...borderColor(`${button.backgroundActive}88`),
        borderColorHover: button.backgroundActive,
        fontSize: 17,
        fontWeight: 'regular',
      },
    });
  }, [button.backgroundActive]);

  return (
    <Wrapper>
      {header === undefined ? (
        EmptyFragment
      ) : typeof header === 'string' ? (
        <Title>{header}</Title>
      ) : (
        header
      )}
      <ButtonsWrapper>
        {hours.flatMap(hour => {
          return minutes.map(minute => {
            const text = buttonText(hour, minute);
            return (
              <TimeButton data-hour={hour} data-minute={minute} key={text} onClick={handleClick}>
                {text}
              </TimeButton>
            );
          });
        })}
      </ButtonsWrapper>
    </Wrapper>
  );
};
TimePicker.displayName = 'TimePicker';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #333;
`;

const Title = styled.div`
  text-align: center;
  font-size: 20px;
`;

const ButtonsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  font-size: 18px;
  grid-gap: 8px 8px;
`;
