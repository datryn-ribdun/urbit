import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { roleForShip } from '@urbit/api';
import { Box, Button, Col, Row } from '@tlon/indigo-react';
import { FaFolder, FaFolderOpen, FaCheckCircle } from 'react-icons/fa';
import airlock from '~/logic/api';
import { IS_MOBILE, IS_SHORT_SCREEN } from '~/logic/lib/platform';
import { getGroupFromWorkspace } from '~/logic/lib/workspace';
import useGroupState from '~/logic/state/group';
import useSettingsState from '~/logic/state/settings';
import { useLocalStorageState } from '~/logic/lib/useLocalStorageState';
import useHarkState, { selHarkGraph } from '~/logic/state/hark';
import useMetadataState from '~/logic/state/metadata';
import { Workspace } from '~/types';
import { getNavbarHeight } from '~/views/components/navigation/MobileNavbar';
import { GroupSwitcher } from '../GroupSwitcher';
import { SidebarGroupList } from './SidebarGroupList';
import { getEntryTitle, GroupOrder } from './SidebarGroupSorter';
import { markEachAsRead } from '@urbit/api';

export const FOLDER_FOCUS_HEIGHT = 40;
export const HEADER_HEIGHT = 50 + FOLDER_FOCUS_HEIGHT;

const ScrollbarLessCol = styled(Col)`
  scrollbar-width: none !important;

  ::-webkit-scrollbar {
    display: none;
  }
`;

interface SidebarProps {
  recentGroups: string[];
  selected?: string;
  baseUrl: string;
  workspace: Workspace;
}

export function Sidebar({ baseUrl, selected, workspace, recentGroups }: SidebarProps): ReactElement | null {
  const { associations } = useMetadataState();
  const groupPath = getGroupFromWorkspace(workspace);
  const harkState = useHarkState.getState();
  const { unreads, readCount } = harkState;
  const [changingSort, setChangingSort] = useState(false);
  const { groupSorter, putEntry } = useSettingsState.getState();
  const [groupOrder, setGroupOrder] = useState<GroupOrder>(JSON.parse(groupSorter.order || '[]'));

  const [showOnlyUnread, setShowOnlyUnread] = useLocalStorageState(
    'showOnlyUnread', false
  );
  const focusMessages = baseUrl.includes('~landscape/messages');

  const saveGroupOrder = useCallback((newOrder) => {
    const validOrder = newOrder.filter(o => getEntryTitle(o, associations));
    putEntry('groupSorter', 'order', JSON.stringify(validOrder));
    setGroupOrder(validOrder);
  }, [associations, putEntry, setGroupOrder]);

  useEffect(() => {
    const newGroupOrder = JSON.parse(groupSorter.order || '[]');
    if (newGroupOrder.length) {
      setGroupOrder(newGroupOrder);
    }
  }, [groupSorter.order]);

  const collapseAllFolders = (collapsed: boolean) =>
    saveGroupOrder(
      groupOrder.map(go => (go && typeof go !== 'string') ? ({ ...go, collapsed }) : (go))
    );

  const markAllRead = useCallback(() => {
    if (confirm('Are you sure you want to clear all unread indicators?')) {
      Object.values(associations.graph).forEach(({ resource, metadata }) => {
        if (metadata.config.graph === 'publish') {
          harkState.readGraph(resource);
        } else if (metadata.config.graph === 'link') {
          const unreads = selHarkGraph(resource)(harkState);
          const [,,ship,name] = resource.split('/');
          unreads.each.forEach((u) => {
            airlock.poke(markEachAsRead({
              desk: (window as any).desk,
              path: `/graph/${ship}/${name}`
            }, u));
          });
        }
      });

      Object.keys(unreads).forEach((key) => {
        if (unreads[key].count) {
          readCount(key);
        }
      });
    }
  }, [unreads, harkState, readCount]);

  const groups = useGroupState(state => state.groups);
  const navbarHeight = getNavbarHeight();
  const isSmallScreen = IS_MOBILE || IS_SHORT_SCREEN;

  const role = groups?.[groupPath] ? roleForShip(groups[groupPath], window.ship) : undefined;
  const isAdmin = (role === 'admin') || (workspace?.type === 'home');
  let groupsHeight = `calc(75% - ${HEADER_HEIGHT / 2}px)`;
  let messagesHeight = `calc(25% - ${HEADER_HEIGHT / 2}px)`;
  if (isSmallScreen && focusMessages) {
    messagesHeight = `calc(100% - ${(IS_SHORT_SCREEN ? 0 : navbarHeight) + HEADER_HEIGHT - FOLDER_FOCUS_HEIGHT}px)`;
  } else if (isSmallScreen) {
    groupsHeight = `calc(100% - ${(IS_SHORT_SCREEN ? 0 : navbarHeight) + HEADER_HEIGHT}px)`;
  } else if (focusMessages) {
    groupsHeight = `calc(50% - ${HEADER_HEIGHT / 2}px)`;
    messagesHeight = `calc(50% - ${FOLDER_FOCUS_HEIGHT / 8 - 1}px)`;
  } else if (showOnlyUnread) {
    groupsHeight = `calc(100% - ${HEADER_HEIGHT}px)`;
  } else if (changingSort) {
    groupsHeight = `calc(100% - ${HEADER_HEIGHT - FOLDER_FOCUS_HEIGHT - 3}px)`;
  }

  const groupListProps = { selected, baseUrl, changingSort, groupOrder, saveGroupOrder, showOnlyUnread };
  // const selectorIconProps = { p: 2, cursor: 'pointer', size: 20 };
  const folderIconStyle = { height: 14, width: 18, padding: 2, marginRight: 12, cursor: 'pointer', color: 'inherit' };
  const smallButtonProps = { fontSize: '13px', py: 0, px: 2, height: '24px' };

  const showGroups = !isSmallScreen || !focusMessages || (showOnlyUnread && !focusMessages);
  const showMessages = !changingSort && !showOnlyUnread && !isSmallScreen || focusMessages;

  const hasFolder = Boolean(groupOrder.find(go => go && typeof go !== 'string' && 'folder' in go));

  return (
    <Box>
      <GroupSwitcher
        recentGroups={recentGroups}
        baseUrl={baseUrl}
        isAdmin={isAdmin}
        workspace={workspace}
        changingSort={changingSort}
        setChangingSort={setChangingSort}
        groupOrder={groupOrder}
        saveGroupOrder={saveGroupOrder}
      />
      {(!focusMessages && !changingSort) && (
        <Row alignItems="center" justifyContent="space-between" px="14px" py={2} borderRight={1} borderBottom={1} borderColor="lightGray" flexWrap="wrap">
          <Row alignItems="center" color="black">
            {hasFolder ? (
              <>
                <FaFolder style={folderIconStyle} onClick={() => collapseAllFolders(true)} />
                <FaFolderOpen style={folderIconStyle} onClick={() => collapseAllFolders(false)} />
              </>
            ) : (
              <Button {...smallButtonProps} mr={3} onClick={() => setChangingSort(!changingSort)}>Add Folder</Button>
            )}
            <FaCheckCircle style={{ ...folderIconStyle, height: 16, width: 16 }} onClick={markAllRead} />
          </Row>
          {!showOnlyUnread && <Button {...smallButtonProps} onClick={() => setShowOnlyUnread(true)}>Focus Unread</Button>}
          {showOnlyUnread && <Button {...smallButtonProps} onClick={() => setShowOnlyUnread(false)}>Show All</Button>}
        </Row>
      )}
      {showGroups && (
        <ScrollbarLessCol
          display="flex"
          width="100%"
          gridRow="1/2"
          gridColumn="1/2"
          borderTopLeftRadius={4}
          borderRight={1}
          borderRightColor="lightGray"
          overflowY="scroll"
          fontSize={0}
          position={IS_MOBILE ? 'absolute' : 'relative'}
          height={groupsHeight}
          borderBottom={1}
          borderBottomColor="lightGray"
        >
          <Box mt={1} />
          <SidebarGroupList {...groupListProps} {...{ changingSort }} />
        </ScrollbarLessCol>
      )}
      {showMessages && (
        <ScrollbarLessCol
          display="flex"
          width="100%"
          gridRow="1/2"
          gridColumn="1/2"
          borderTopLeftRadius={2}
          borderRight={1}
          borderRightColor="lightGray"
          overflowY="scroll"
          fontSize={0}
          position={IS_MOBILE ? 'absolute' : 'relative'}
          height={messagesHeight}
          borderBottomLeftRadius={4}
        >
          <SidebarGroupList {...groupListProps} messages />
        </ScrollbarLessCol>
      )}
    </Box>
  );
}
