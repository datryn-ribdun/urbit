import React, { ReactElement, ReactNode, Suspense, useCallback, useState } from 'react';
import { Sidebar } from './Sidebar/Sidebar';
import { Workspace } from '~/types/workspace';
import { Body } from '~/views/components/Body';
import ErrorBoundary from '~/views/components/ErrorBoundary';
import { useShortcut } from '~/logic/state/settings';
import { Loading } from '~/views/components/Loading';
import { IS_MOBILE } from '~/logic/lib/platform';

interface SkeletonProps {
  children: ReactNode;
  recentGroups: string[];
  selected?: string;
  baseUrl: string;
  mobileHide?: boolean;
  desktopHide?: boolean;
  workspace: Workspace;
}

export const Skeleton = React.memo((props: SkeletonProps): ReactElement => {
  const [sidebar, setSidebar] = useState(true);
  useShortcut('hideSidebar', useCallback(() => {
    setSidebar(s => !s);
  }, []));

  const hideMobileSidebar = props.mobileHide && IS_MOBILE;
  const hideDesktopSidebar = props.desktopHide && !IS_MOBILE;

  return (
    <Body
      display="grid"
      gridTemplateColumns={
        sidebar && !hideDesktopSidebar
        ?  ['100%', 'minmax(200px, 1fr) 3fr', 'minmax(250px, 1fr) 4fr', 'minmax(300px, 1fr) 5fr']
        : '100%'
      }
      gridTemplateRows="100%"
    >
      <ErrorBoundary>
        { (sidebar && !hideMobileSidebar && !hideDesktopSidebar) && (
          <Sidebar
            recentGroups={props.recentGroups}
            selected={props.selected}
            baseUrl={props.baseUrl}
            workspace={props.workspace}
          />
        )}
      </ErrorBoundary>
      <Suspense fallback={Loading}>{props.children}</Suspense>
    </Body>
  );
});
