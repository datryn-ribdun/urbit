import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router';
import _ from 'lodash';
import { Associations, Timebox } from '@urbit/api';
import { Box, Icon } from '@tlon/indigo-react';

import useGraphState, { useInbox } from '~/logic/state/graph';
import useHarkState from '~/logic/state/hark';
import { getFeedPath, getResourcePath, modulo } from '~/logic/lib/util';
import useMetadataState from '~/logic/state/metadata';
import { useShortcut } from '~/logic/state/settings';
import useGroupState from '~/logic/state/group';
import useInviteState from '~/logic/state/invite';
import { IS_MOBILE } from '~/logic/lib/platform';
import { roleForShip } from '~/logic/lib/group';
import { Workspace } from '~/types/workspace';
import { getGraphUnreads } from '~/views/apps/launch/components/Groups';
import { SidebarListConfig } from './types';
import { dmUnreads, getItems, sidebarSort } from './util';
import { SidebarAssociationItem, SidebarDmItem, SidebarItemBase, SidebarPendingItem } from './SidebarItem';
import { getGroupFromWorkspace } from '~/logic/lib/workspace';
import { useLocalStorageState } from '~/logic/lib/useLocalStorageState';

export const getHasNotification = (associations: Associations, group: string, unseen: Timebox) => {
  let hasNotification = false;
  for (const key in unseen) {
    const formattedKey = key.replace('landscape/graph', '/ship').replace('/mention', '');
    if (associations.graph[formattedKey]?.group === group) {
      hasNotification = true;
      break;
    }
  }
  return hasNotification;
};

export function SidebarGroup({ baseUrl, selected, showOnlyUnread, workspace, title }: {
  workspace: Workspace;
  baseUrl: string;
  showOnlyUnread: boolean;
  selected?: string;
  title?: string;
}): ReactElement {
  const groupRef = useRef<HTMLElement>(null);
  const isGroup = workspace.type === 'group';
  const isMessages = workspace.type === 'messages';
  const isHome = workspace.type === 'home';
  const groupPath = getGroupFromWorkspace(workspace);
  const groupSelected =
    (isMessages && baseUrl.includes('messages')) ||
    (isHome && baseUrl.includes('home')) ||
    (workspace.type === 'group' && (baseUrl.replace('/~landscape', '') === workspace.group || baseUrl.includes(`${workspace.group}/resource`)));
  const [collapsed, setCollapsed] = useState(!groupSelected && !isMessages);

  const [config] = useLocalStorageState<SidebarListConfig>(
    `group-config:${groupPath || 'home'}`,
    {
      sortBy: 'lastUpdated',
      hideUnjoined: false
    }
  );

  useEffect(() => {
    if (isGroup && groupSelected && groupRef.current) {
      setTimeout(() => groupRef.current.scrollIntoView(), 100);
    }
  }, []);

  const { associations } = useMetadataState();
  const { groups } = useGroupState();
  const inbox = useInbox();
  const pendingDms = useGraphState(s => [...s.pendingDms].map(s => `~${s}`));
  const graphKeys = useGraphState(s => s.graphKeys);
  const pendingGroupChats = useGroupState(s => _.pickBy(s.pendingJoin, (req, rid) => !(rid in groups) && req.app === 'graph'));
  const inviteGroupChats = useInviteState(
    s => Object.values(s.invites?.['graph'] || {})
    .map(inv => `/ship/~${inv.resource.ship}/${inv.resource.name}`).filter(group => !(group in groups))
  );
  const pending = [...pendingDms, ...Object.keys(pendingGroupChats), ...inviteGroupChats];
  const { unreads, unseen } = useHarkState();

  const ordered = getItems(associations, workspace, inbox, pending)
    .sort(sidebarSort(unreads, pending)[config.sortBy]);

  const history = useHistory();

  const cycleChannels = useCallback((backward: boolean) => {
    const idx = ordered.findIndex(s => s === selected);
    const offset = backward ? -1 : 1;

    const newIdx = modulo(idx+offset, ordered.length - 1);
    const newChannel = ordered[newIdx];
    let path = '';
    if(newChannel.startsWith('~')) {
      path = `/~landscape/messages/dm/${newChannel}`;
    } else {
      const association = associations.graph[ordered[newIdx]];
      if(!association) {
        path = '/~landscape/messages';
        return;
      } else {
        const { metadata, resource } = association;
        const joined = graphKeys.has(resource.slice(7));
        if ('graph' in metadata.config) {
          path = getResourcePath(workspace, resource, joined, metadata.config.graph);
        }
      }
    }
    history.push(path);
  }, [ordered, selected, history.push]);

  useShortcut('cycleForward', useCallback((e: KeyboardEvent) => {
    cycleChannels(false);
    e.preventDefault();
  }, [cycleChannels]));

  useShortcut('cycleBack', useCallback((e: KeyboardEvent) => {
    cycleChannels(true);
    e.preventDefault();
  }, [cycleChannels]));

  const hasNotification = workspace.type === 'group' && getHasNotification(associations, workspace.group, unseen);
  const graphUnreads = getGraphUnreads(associations || ({} as Associations));
  const unreadCount = isGroup ? graphUnreads(groupPath) : dmUnreads(unreads);
  const isSynced = true;
  const to = `/~landscape${isGroup ? workspace?.group : isMessages ? '/messages' : '/home'}`;
  const isMobileMessages = IS_MOBILE && isMessages;
  const groupTitle = title ? title : isHome ? 'My Channels' : 'Messages';
  const association = isGroup ? associations?.groups[workspace.group] : undefined;
  const feedPath = getFeedPath(association);
  const isAdmin = isGroup && roleForShip(groups[workspace.group], window.ship) === 'admin';
  const locked = isGroup && Boolean(groups[association.group]?.policy?.invite);

  if (showOnlyUnread && unreadCount === 0 && !groupSelected) {
    return null;
  }

  return (
    <Box ref={groupRef} position="relative">
      {!isMobileMessages && (
        <SidebarItemBase
          to={to}
          selected={groupSelected}
          hasUnread={unreadCount > 0}
          unreadCount={unreadCount}
          isSynced={isSynced}
          title={groupTitle}
          hasNotification={hasNotification}
          onClick={() => setCollapsed(isMessages ? false : !collapsed)}
          isGroup
          locked={locked}
          isAdmin={isAdmin}
          open={!collapsed}
        >
          {!isMessages && (
            <Icon
              p={1}
              pr="0"
              display="block"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCollapsed(!collapsed);
                groupRef.current?.scrollIntoView();
              }}
              icon={collapsed ? 'TriangleEast' : 'TriangleSouth'}
            />
          )}
        </SidebarItemBase>
      )}
      {!collapsed && (
        <Box position="relative" style={{ zIndex: 0 }}>
          {feedPath && IS_MOBILE && <SidebarItemBase
            to={`/~landscape${groupPath}/feed`}
            selected={history.location.pathname.includes('feed')}
            title="Group Feed"
            groupSelected={groupSelected}
            fontSize="13px"
            isSynced
            hasNotification={false} // How to get notifications and unreads for this?
            hasUnread={false}
            unreadCount={0}
            // unreadCount={count + each.length}
            // hasNotification={Boolean(unseen?.[`landscape${pathAsGraph}/mention`])}
            indent={1}
          >
            <Icon display="block" color="black" icon="Collection" />
          </SidebarItemBase>}
          {ordered.map((pathOrShip) => {
            const pathAsGraph = pathOrShip.replace('ship', 'graph');
            const { count, each } = unreads[pathAsGraph] || { count: 0, each: [] };
            const isDm = pathOrShip.startsWith('~');
            const isPending = pending.includes(pathOrShip);
            const channelSelected = pathOrShip === selected;

            if (showOnlyUnread && !isDm && !channelSelected && (count + each.length) === 0) {
              return null;
            }

            return isDm ? (
                <SidebarDmItem
                  key={pathOrShip}
                  ship={pathOrShip}
                  workspace={workspace}
                  selected={channelSelected}
                  pending={isPending}
                  indent={0.5}
                />
              ) : isPending ? (
                <SidebarPendingItem
                  key={pathOrShip}
                  path={pathOrShip}
                  selected={channelSelected}
                  indent={1}
                />
              ) : (
              <SidebarAssociationItem
                key={pathOrShip}
                selected={channelSelected}
                groupSelected={groupSelected}
                association={associations.graph[pathOrShip]}
                hideUnjoined={config.hideUnjoined}
                fontSize="13px"
                workspace={workspace}
                unreadCount={count + each.length}
                hasNotification={Boolean(unseen?.[`landscape${pathAsGraph}/mention`])}
                indent={isMessages ? 0.5 : 1}
              />
              );
          })}
        </Box>
      )}
    </Box>
  );
}
