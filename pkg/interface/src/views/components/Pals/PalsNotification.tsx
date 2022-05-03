import React from 'react';

import usePalsState from '~/logic/state/pals';
import { Icon, Row, Text } from '@tlon/indigo-react';
import styled from 'styled-components';

export const AcceptRow = styled(Row)`
  padding: 8px;
  cursor: pointer;
  &:hover {
    background-color: ${p => p.theme.colors.washedBlue};
  }
`;

interface PalsNotificationProps {
  ship: string;
}

export const PalsNotification = ({
  ship
}: PalsNotificationProps) => {
  const { addPal } = usePalsState();

  return (
    <AcceptRow width="100%" onClick={() => addPal(ship)}>
      <Icon icon="AddUser" size={16} mr={2} color="blue" />
      <Text>Accept request from <Text mono>~{ship}</Text></Text>
    </AcceptRow>
  );
};
