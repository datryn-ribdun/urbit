import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { FaFolder, FaFolderOpen } from 'react-icons/fa';

import { Box, Button, Col, Icon, Label, Row, Text } from '@tlon/indigo-react';
import useMetadataState from '~/logic/state/metadata';
import { Dropdown } from '~/views/components/Dropdown';
import styled from 'styled-components';
import { useModal } from '~/logic/lib/useModal';
import { useLocalStorageState } from '~/logic/lib/useLocalStorageState';
import { Associations } from '@urbit/api';
import { useThemeWatcher } from '~/logic/lib/useThemeWatcher';

export const getEntryTitle = (g: string | GroupFolder, a: Associations) : string | null => {
  if (!g)
    return null;

  if (g === 'My Channels' || g === 'My Apps')
    return g;

  return typeof g === 'string' ? a.groups[g]?.metadata?.title : g?.folder;
};

export type GroupFolder = {
  folder: string,
  collapsed?: boolean,
  groups: string[]
};
export type GroupOrder = (string | GroupFolder)[];

const FolderRow = styled(Text)`
  padding: 4px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
  &:hover {
    background-color: ${p => p.theme.colors.washedGray};
  }
`;

const GroupTileIcon = styled(Icon)`
  padding: 4px;
  cursor: pointer;
`;

interface GroupTileProps {
  title: string;
  folder?: string;
}

function GroupTile({ title, folder }: GroupTileProps) {
  const isInFolder = Boolean(folder);

  return (
    <Row py={isInFolder ? 1 : 2} px={isInFolder ? 2 : 3}
      my={2} mx={isInFolder ? 0 : 2}
      alignItems="center" justifyContent="space-between"
      borderRadius={2} overflow="hidden"
      whiteSpace="nowrap" textOverflow="ellipsis"
      backgroundColor="white"
    >
      <Text overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis">{title}</Text>
    </Row>
  );
}

interface GroupCardProps {
  title: string;
  group: string;
  index: number;
}

function GroupCard({ title, group, index }: GroupCardProps) {
  return (
    <Draggable key={group} draggableId={group} index={index}>
      {provided => <Box ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
        <GroupTile {...{ title, group }} />
      </Box>}
    </Draggable>
  );
}

interface FolderCardProps {
  title: string;
  group: string;
  index: number;
  groups: string[];
  getTitle: (g: string | GroupFolder) => string;
  deleteFolder: (folder: string) => void;
}

function FolderCard({
  title,
  group,
  index,
  groups,
  getTitle,
  deleteFolder
}: FolderCardProps) {
  const { theme } = useThemeWatcher();
  const [collapsed, setCollapsed] = useState(false);
  const folderStyle = { height: '14px', width: '18px', padding: '4px', marginLeft: '-4px', color: theme.colors.black };

  return (
    <Draggable key={group} draggableId={group} index={index}>
      {provided => (
        <Col py={2} px={3}
          m={2} backgroundColor="white"
          borderRadius={2}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          overflow="hidden"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
        >
          <Row alignItems="center" justifyContent="space-between" ml={-1}>
            <Row alignItems="center">
              {collapsed ? (
                <FaFolder style={folderStyle} cursor="pointer" onClick={() => setCollapsed(!collapsed)} />
              ) : (
                <FaFolderOpen style={folderStyle} cursor="pointer" onClick={() => setCollapsed(!collapsed)} />
              )}
              <Text fontWeight="600">{title}</Text>
            </Row>
            <Dropdown
              dropWidth='192px'
              width='auto'
              alignY='top'
              alignX='right'
              flexShrink={0}
              offsetY={-24}
              options={
                <Col
                  p={2}
                  backgroundColor='white'
                  border={1}
                  borderColor="lightGray"
                  borderRadius={2}
                >
                  <FolderRow onClick={() => deleteFolder(title)} color="red">Delete folder</FolderRow>
                </Col>
              }
            >
              <GroupTileIcon icon="Menu" />
            </Dropdown>
          </Row>
          {!collapsed && (
            <Droppable droppableId={title} style={{ width: '100%' }}>
              {provided => (
                <Box {...provided.droppableProps} ref={provided.innerRef} backgroundColor="washedGray" mx={-2} mt={2} px={1} py={0} borderRadius={2} minHeight="60px">
                  {groups.map((g, i) => {
                    return (!g || !getTitle(g)) ? null : <GroupCard key={g} title={getTitle(g)} group={g} index={i} />;
                  })}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          )}
        </Col>
      )}
    </Draggable>
  );
}

interface SidebarGroupSorterProps {
  groupOrder?: GroupOrder;
  deleteFolder: (folder: string) => void;
}

export function SidebarGroupSorter({
  groupOrder = [],
  deleteFolder
}: SidebarGroupSorterProps): ReactElement {
  const { associations } = useMetadataState();

  const [hasSeenInfoModal, setHasSeenInfoModal] = useLocalStorageState(
    'sortingInfoModalShown', false
  );

  const { modal, showModal } = useModal({ modal:
    (dismiss: () => void) => {
      const onCancel = (e) => {
        e.stopPropagation();
        dismiss();
      };
      return (
        <Col p={4}>
          <Text fontWeight={600}>Order Groups and Folders</Text>
          <Label mt={2}>
            Use the {'"+"'} button to create a folder. Drag and drop groups to change the order.
            Drop a group on top of the gray folder area to add it to the folder.
          </Label>
          <Row mt={2} justifyContent="center">
            <Button onClick={onCancel}>Got it</Button>
          </Row>
        </Col>
      );
    } });

  useEffect(() => {
    if (!hasSeenInfoModal) {
      showModal();
      setHasSeenInfoModal(true);
    }
  }, []);

  const getTitle = useCallback((g: string | GroupFolder) => getEntryTitle(g, associations), [associations]);

  return (
    <>
      <Droppable droppableId="groups" style={{ width: '100%' }}>
        {provided => (
          <Box {...provided.droppableProps} ref={provided.innerRef} backgroundColor="washedGray" mt="-8px" mb="-4px">
            {groupOrder.filter(go => getTitle(go)).map((entry, index, { length }) => {
              const title = getTitle(entry);
              if (typeof entry === 'string' && title) {
                return <GroupCard {...{ key: entry, title, group: entry, index }} />;
              } else if (entry && typeof entry !== 'string' && title) {
                return (
                  <FolderCard
                    {...{ key: entry.folder, title, group: entry.folder, index, groups: entry.groups, getTitle, deleteFolder }}
                  />
                );
              }

              return null;
            })}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
      {modal}
    </>
  );
}
