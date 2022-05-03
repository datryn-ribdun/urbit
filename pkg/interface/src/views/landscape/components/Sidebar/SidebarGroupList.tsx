import React, { MouseEvent, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router';
import { DragDropContext } from 'react-beautiful-dnd';
import _ from 'lodash';
import { resourceAsPath } from '@urbit/api';
import { Box, LoadingSpinner } from '@tlon/indigo-react';

import useMetadataState, { usePreview } from '~/logic/state/metadata';
import useGroupState from '~/logic/state/group';
import useInviteState from '~/logic/state/invite';
import { useQuery } from '~/logic/lib/useQuery';
import { sortGroupsAlph } from '~/views/apps/launch/components/Groups';
import { SidebarItemBase } from './SidebarItem';
import { GroupOrder, SidebarGroupSorter } from './SidebarGroupSorter';
import {  SidebarGroup } from './SidebarGroup';
import { SidebarFolder } from './SidebarFolder';
import { MyApps } from './MyApps';

interface PendingSidebarGroupProps {
  path: string;
}

function PendingSidebarGroup({ path }: PendingSidebarGroupProps) {
  const history = useHistory();
  const { preview } = usePreview(path);
  const title = preview?.metadata?.title || path;
  const { toQuery } = useQuery();
  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    history.push(toQuery({ 'join-kind': 'groups', 'join-path': path }));
  };

  const joining = useGroupState(s => s.pendingJoin[path]?.progress);
  const isJoining = Boolean(joining && joining !== 'done');

  return (
    <SidebarItemBase
      to="/"
      onClick={onClick}
      title={title}
      selected={false}
      pending={isJoining}
      hasUnread={false}
      hasNotification={!joining}
      isSynced={!joining}
      isGroup
    />
  );
}

export function SidebarGroupList({
  messages = false,
  changingSort = false,
  groupOrder,
  saveGroupOrder,
  ...props
}: {
  baseUrl: string;
  changingSort?: boolean;
  selected?: string;
  messages?: boolean;
  groupOrder: GroupOrder;
  showOnlyUnread: boolean;
  saveGroupOrder: (groupOrder: GroupOrder) => void;
}): ReactElement {
  const { associations } = useMetadataState();
  const { groups } = useGroupState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 8000);
  }, []);

  const handleDragAndDrop = useCallback(({ source, destination }) => {
    if (!destination)
      return;
    // Do nothing if trying to put a folder inside a folder
    if (source.droppableId === 'groups' && destination.droppableId !== 'groups' && typeof groupOrder[source.index] !== 'string')
      return;

    const items = Array.from(groupOrder);
    let reorderedItem;
    if (source.droppableId === 'groups') {
      reorderedItem = items.splice(source.index, 1)[0];
    } else {
      const folder = items.find(go => go && typeof go !== 'string' && go.folder === source.droppableId);

      if (typeof folder !== 'string') {
        reorderedItem = folder.groups.splice(source.index, 1)[0];
      } else {
        return;
      }
    }

    if (!reorderedItem)
      return;

    if (destination.droppableId === 'groups') {
      items.splice(destination.index, 0, reorderedItem);
    } else {
      const folder = items.find(go => go && typeof go !== 'string' && go.folder === destination.droppableId);

      if (typeof folder !== 'string') {
        folder.groups.splice(destination.index, 0, reorderedItem);
      } else {
        return;
      }
    }

    saveGroupOrder(items);
  }, [groupOrder, saveGroupOrder]);

  const deleteFolder = useCallback((folder: string) => {
    if (confirm('Are you sure you want to delete this folder? The groups will be moved to the bottom of the main list.')) {
      let groups: string[] = [];
      const newOrder = groupOrder.filter((go) => {
        if (go && typeof go !== 'string' && go.folder === folder) {
          groups = go.groups;
          return false;
        }
        return true;
      });
      newOrder.concat(groups);
      saveGroupOrder(newOrder);
    }
  }, [groupOrder, saveGroupOrder]);

  const toggleCollapse = useCallback((folder: string) => () => {
    const newOrder = groupOrder.map((go) => {
      if (go && typeof go !== 'string' && go.folder === folder) {
        go.collapsed = !go.collapsed;
      }
      return go;
    });
    saveGroupOrder(newOrder);
  }, [groupOrder, saveGroupOrder]);

  const groupList = useMemo(() => Object.values(associations?.groups || {})
    .filter(e => e?.group in groups)
    .sort(sortGroupsAlph), [associations, groups]);

  useEffect(() => {
    if (!groupOrder.length)
      return;

    const sortedGroups = groupOrder.reduce((acc, cur) => {
      if (cur && typeof cur !== 'string') {
        return acc.concat(cur.groups);
      } else if (typeof cur === 'string') {
        return acc.concat([cur]);
      }
      return acc;
    }, []);

    const missingGroups = groupList.map(({ group }) => group).filter(g => !sortedGroups.includes(g));
    if (!sortedGroups.includes('My Channels')) {
      missingGroups.push('My Channels');
    }
    if (!sortedGroups.includes('My Apps')) {
      missingGroups.push('My Apps');
    }

    if (missingGroups.length) {
      saveGroupOrder(missingGroups.concat(groupOrder as any[]));
    }
  }, [groupList]);

  const joining = useGroupState(s =>
    _.omit(
      _.pickBy(s.pendingJoin || {}, req => req.app === 'groups' && req.progress != 'abort'),
      groupList.map(g => g.group)
    )
  );

  const invites = useInviteState(s => Object.values(s.invites?.['groups'] || {}).map(inv => resourceAsPath(inv?.resource)) || []);
  const pending = _.union(invites, Object.keys(joining)).filter(group =>
    !(group in (groups?.groups || {})) && !(group in (associations.groups || {}))
  );

  if (messages) {
    return <SidebarGroup {...props} workspace={{ type: 'messages' }} />;
  } else if (!groupList.length && loading) {
    return <Box width="100%" height="100%" display="flex" alignItems="center" justifyContent="center">
      <LoadingSpinner />
    </Box>;
  }

  if (changingSort) {
    const groupsToSort = groupOrder.length ? groupOrder : ['My Channels', 'My Apps'].concat(groupList.map(g => g.group));
    return <DragDropContext onDragEnd={handleDragAndDrop}>
      <SidebarGroupSorter {...{ groupOrder: groupsToSort, deleteFolder }} />
    </DragDropContext>;
  }

  return (
    <>
      {groupOrder.length ? groupOrder.map((go) => {
        if (typeof go === 'string') {
          if (go === 'My Channels') {
            return <SidebarGroup {...props} workspace={{ type: 'home' }} />;
          } else if (go === 'My Apps') {
            return <MyApps {...props} />;
          }

          const g = associations.groups[go];
          if (!g)
            return null;

          return <SidebarGroup key={g.group} {...props} workspace={{ type: 'group', group: g.group }} title={g.metadata.title} />;
        } else if (go?.folder) {
          return <SidebarFolder {...props} toggleCollapse={toggleCollapse(go.folder)} {...props} folder={go} />;
        }

        // TODO: handle folders in groupOrder
        return null;
      }) : (
        <>
          <MyApps {...props} />
          <SidebarGroup {...props} workspace={{ type: 'home' }} />
          {groupList.map((g: any) => (
            <SidebarGroup
              key={g.group} {...props}
              workspace={{ type: 'group', group: g.group }}
              title={g.metadata.title}
            />
          ))}
        </>
      )}
      {pending.map(p => <PendingSidebarGroup key={p} path={p} />)}
    </>
  );
}
