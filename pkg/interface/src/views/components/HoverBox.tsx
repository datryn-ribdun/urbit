import { Box } from '@tlon/indigo-react';
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { PropFunc } from '~/types/util';
interface HoverBoxProps {
  selected: boolean;
  bg: string;
  bgActive: string;
  open: boolean;
}
export const HoverBox = styled(Box)<HoverBoxProps>`
  background-color: ${p =>
    p.selected && !p.open ? p.theme.colors[p.bgActive] : p.theme.colors[p.bg]};
  cursor: pointer;
  &:hover {
    background-color: ${p => p.open ? p.theme.colors[p.bg] : p.theme.colors[p.bgActive]};
  }
`;

interface HoverBoxLinkProps {
  to: string;
}

export const HoverBoxLink = React.forwardRef<HTMLAnchorElement, HoverBoxLinkProps & PropFunc<typeof HoverBox>>(({
  to,
  children,
  ...rest
}, ref) => (
  <Link ref={ref} to={to}>
    <HoverBox {...rest}>{children}</HoverBox>
  </Link>
));
