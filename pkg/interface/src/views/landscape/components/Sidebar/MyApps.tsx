import React, { useEffect, useState } from 'react';
import { Box, Icon, Image } from '@tlon/indigo-react';

import useDocketState from '~/logic/state/docket';
import { SidebarItemBase } from './SidebarItem';
import { getAppHref } from '../Apps/AppTile';

export const EXCLUDED_DESKS = ['landscape', 'garden', 'escape'];

interface MyAppsProps {
  baseUrl: string;
  showOnlyUnread: boolean;
}

export const MyApps = ({
  showOnlyUnread,
  ...props
}: MyAppsProps) => {
  const [collapsed, setCollapsed] = useState(true);
  const toggleCollapse = () => setCollapsed(!collapsed);
  const { charges, fetchCharges } = useDocketState.getState();
  const chargesList = Object.values(charges).filter(({ desk }) => !EXCLUDED_DESKS.includes(desk));

  useEffect(() => {
    fetchCharges();
  }, []);

  useEffect(() => {
    setCollapsed(!window.location.pathname.includes('/~landscape/apps'));
  }, [window.location.pathname]);

  if (showOnlyUnread) {
    return null;
  }

  return (
    <Box position="relative">
      <SidebarItemBase
        to={'/~landscape/apps'}
        title='My Apps'
        unreadCount={0}
        onClick={toggleCollapse}
        isSynced
        open={!collapsed}
        isApps
      >
        <Icon
          p={1}
          pr="0"
          display="block"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCollapsed(!collapsed);
          }}
          icon={collapsed ? 'TriangleEast' : 'TriangleSouth'}
        />
      </SidebarItemBase>
      {!collapsed && (
        <Box position="relative" style={{ zIndex: 0 }} pl="20px">
          {chargesList.map((charge) => {
            const to = getAppHref(charge.href);
            return (
              <SidebarItemBase
                key={charge.desk}
                to={to}
                title={charge.title}
                selected={window.location.href.includes(to)}
                isSynced
              >
                <Box width="24px" height="24px" position="relative" background={charge.color}>
                  {charge.image && (
                    <Image
                      src={charge.image}
                      position="absolute"
                      top="0"
                      left="0"
                      width="100%"
                      height="100%"
                      alt=""
                      onError={console.error}
                    />
                  )}
                </Box>
              </SidebarItemBase>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
