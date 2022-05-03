import React, { FunctionComponent } from 'react';
import { chadIsRunning, DocketHref } from '@urbit/api';
import { ChargeWithDesk } from '~/logic/state/docket';
import { Link } from 'react-router-dom';
import { Box, Col, H3, Image, Text } from '@tlon/indigo-react';
import Spinner from '~/views/components/Spinner';

export function getAppHref(href: DocketHref) {
  const appHref = 'site' in href ? href.site : `/apps/${href.glob.base}/`;
  const params = new URLSearchParams(window.location.search);
  params.set('app', encodeURIComponent(appHref));
  return `/~landscape/apps/app?${params.toString()}`;
}

type TileProps = {
  charge: ChargeWithDesk;
  desk: string;
  disabled?: boolean;
};

export const Tile: FunctionComponent<TileProps> = ({ charge, desk, disabled = false }) => {
  const { title, image, color, chad, href } = charge;
  const loading = !disabled && 'install' in chad;
  const suspended = disabled || 'suspend' in chad;
  const hung = 'hung' in chad;
  const active = !disabled && chadIsRunning(chad);
  const link = getAppHref(href);

  // FIGURE OUT HOW TO ROUTE TO THE APP
  return (
    <Link
      to={active ? link : undefined}
      style={{ marginTop: 24, marginLeft: 24 }}
    >
      <Col position="relative" backgroundColor={color} width="200px" height="200px" borderRadius="6px">
        <Box position="absolute" top="4px" left="4px">
          {!active && (
            <>
              {loading && <Spinner />}
              <Text color="lightGray">
                {suspended ? 'Suspended' : loading ? 'Installing' : hung ? 'Errored' : null}
              </Text>
            </>
          )}
        </Box>
        {image && !loading && (
          <Image
            src={image}
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="100%"
            alt=""
            onError={console.error}
          />
        )}
        {title && (
          <Box background="lightGray" position="absolute" bottom="8px" left="8px" borderRadius="4px" p={1} px={2}>
            <H3>{title}</H3>
          </Box>
        )}
      </Col>
    </Link>
  );
};
