import React, { useEffect } from 'react';
import { FaFolder, FaFolderOpen } from 'react-icons/fa';
import { Associations } from '@urbit/api';
import { Box } from '@tlon/indigo-react';

import useHarkState from '~/logic/state/hark';
import useMetadataState from '~/logic/state/metadata';
import { useDark } from '~/logic/state/join';
import { getGraphUnreads } from '~/views/apps/launch/components/Groups';
import { GroupFolder } from './SidebarGroupSorter';
import { SidebarItemBase } from './SidebarItem';
import { getHasNotification, SidebarGroup } from './SidebarGroup';
import { MyApps } from './MyApps';

interface SidebarFolderProps {
  baseUrl: string;
  folder: GroupFolder;
  showOnlyUnread: boolean;
  toggleCollapse: () => void;
}

export const SidebarFolder = ({
  folder,
  toggleCollapse,
  ...props
}: SidebarFolderProps) => {
  const { associations } = useMetadataState();
  const graphUnreads = getGraphUnreads(associations || ({} as Associations));
  const { unseen } = useHarkState();
  const collapsed = Boolean(folder.collapsed);
  const dark = useDark();
  const folderIconStyle = {
    height: '14px',
    width: '18px',
    paddingTop: '3px',
    color: dark ? 'white' : 'black'
  };

  const { unreadCount, hasNotification, hasGroupSelected } = folder.groups.reduce((acc, group) => {
    const groupSelected =
      (group === 'My Channels' && props.baseUrl.includes('home')) ||
      props.baseUrl.includes(`${group}`);

    return {
      unreadCount: acc.unreadCount + graphUnreads(group),
      hasNotification: acc.hasNotification || getHasNotification(associations, group, unseen),
      hasGroupSelected: acc.hasGroupSelected || groupSelected
    };
  }, { unreadCount: 0, hasNotification: false, hasGroupSelected: false });

  useEffect(() => {
    if (hasGroupSelected && collapsed) {
      toggleCollapse();
    }
  }, [hasGroupSelected]);

  if (props.showOnlyUnread && !hasGroupSelected && unreadCount === 0) {
    return null;
  }

  return (
    <Box position="relative">
      <SidebarItemBase
        to={''}
        title={folder.folder}
        hasUnread={unreadCount > 0}
        unreadCount={unreadCount}
        hasNotification={hasNotification}
        onClick={toggleCollapse}
        isFolder
        isSynced
        open={!collapsed}
      >
        <Box display="block" pl="2px"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCollapse();
          }}
        >
          {collapsed ? <FaFolder style={folderIconStyle} /> : <FaFolderOpen style={folderIconStyle} />}
        </Box>
      </SidebarItemBase>
      {!collapsed && (
        <Box position="relative" style={{ zIndex: 0 }} pl="20px">
          {folder.groups.map((group) => {
            if (group === 'My Channels') {
              return <SidebarGroup key={group} {...props} workspace={{ type: 'home' }} />;
            } else if (group === 'My Apps') {
              return <MyApps {...props} />;
            }

            const g = associations.groups[group];
            if (!g)
              return null;

            return <SidebarGroup key={g.group} {...props} workspace={{ type: 'group', group: g.group }} title={g.metadata.title} />;
          })}
        </Box>
      )}
    </Box>
  );
};
