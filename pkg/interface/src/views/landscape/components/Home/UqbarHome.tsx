import React, { useEffect, useMemo, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Box, Text, Row, Button, Icon, H2, Col, H3 } from '@tlon/indigo-react';
import useHarkState from '~/logic/state/hark';
import usePalsState from '~/logic/state/pals';
import useGroupState from '~/logic/state/group';
import useMetadataState from '~/logic/state/metadata';
import { NewGroup } from '~/views/landscape/components/NewGroup';
import ModalButton from '~/views/apps/launch/components/ModalButton';
import Tile from '~/views/apps/launch/components/tiles/tile';
import { ScrollbarLessBox } from '~/views/apps/launch/App';
import { sortGroupsAlph } from '~/views/apps/launch/components/Groups';
import { NewBox } from '~/views/apps/notifications/NewBox';
import { version } from '~/../package.json';

export function UqbarHome(props) {
  const history = useHistory();
  const { pending } = usePalsState();
  const { notificationsCount } = useHarkState();
  const { associations } = useMetadataState();
  const { groups } = useGroupState();
  const groupList = useMemo(() => Object.values(associations?.groups || {})
    .filter(e => e?.group in groups)
    .sort(sortGroupsAlph), [associations, groups]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 8000);
  }, []);

  return (
    <ScrollbarLessBox
      height="100%"
      overflowY="scroll"
      display="flex"
      flexDirection="column"
      mt={3}
    >
      <H2 mb={3} ml={3}>EScape from Eternal September <Text fontSize="16px">(v{version})</Text></H2>
      <Link to='/~info'>
        <H3 ml={3} borderBottom="1px solid gray">App Info</H3>
      </Link>
      {(!loading && !groupList.length) && (
        <Col ml={3} mt={3}>
          <H3 mb={2}>
            New here?
          </H3>
          <Link to="/?join-kind=groups&join-path=%2Fship%2F%7Erondev%2Fgroup-discovery">
            <Text>Join <Text color="blue">~rondev/group-discovery</Text> to find some groups</Text>
          </Link>
        </Col>
      )}
      {(notificationsCount === 0/* && pending.length === 0*/) && <Text ml={3} mt={3}>No notifications</Text>}
      <NewBox hideLabel />
      <Box
        mx={2}
        display="grid"
        gridTemplateColumns="repeat(auto-fill, minmax(128px, 1fr))"
        gridGap={3}
        p={2}
        pt={0}
      >
        {/* <Tile
          bg="white"
          color="scales.black20"
          to="/~landscape/home"
          p={0}
        >
          <Box
            p={2}
            height="100%"
            width="100%"
            bg="scales.black20"
            border={1}
            borderColor="lightGray"
          >
            <Row alignItems="center">
              <Icon color="black" icon="Home" />
              <Text ml={2} mt="1px" color="black">
                My Channels
              </Text>
            </Row>
          </Box>
        </Tile>
        <Tile>
          <Col display="flex" alignItems="center" justifyContent="center" height="100%">
            <ModalButton
              icon="CreateGroup"
              bg="white"
              color="black"
              text="New Group"
              style={{ gridColumnStart: 1 }}
            >
              <NewGroup />
            </ModalButton>
          </Col>
        </Tile>
        <Tile>
          <Col display="flex" alignItems="center" justifyContent="center" height="100%">
            <Button
              border={0}
              p={0}
              borderRadius={2}
              onClick={() => history.push({ search: '?join-kind=group' })}
            >
              <Row backgroundColor="white" gapX="2" p={2} height="100%" width="100%" alignItems="center">
                <Icon icon="Plus" />
                <Text fontWeight="medium" whiteSpace="nowrap">Join Group</Text>
              </Row>
            </Button>
          </Col>
        </Tile> */}
      </Box>
    </ScrollbarLessBox>
  );
}
