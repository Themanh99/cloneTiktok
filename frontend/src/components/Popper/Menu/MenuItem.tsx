import React from 'react';
import Button from '../../Button/Button';
import styles from '../Menu/Menu.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

export type MenuItemData = {
  separate?: boolean;
  icon?: React.ReactNode;
  to?: string;
  title?: React.ReactNode;
  [key: string]: any;
};

type MenuItemProps = {
  data: MenuItemData;
  onClick?: () => void;
};

function MenuItem({ data, onClick }: MenuItemProps) {
  const AnyButton = Button as any;
  const classes = cx('menu-item', {
    separate: data.separate,
  });
  return (
    <AnyButton onClick={onClick} className={classes} leftIcon={data.icon} to={data.to}>
      {data.title}
    </AnyButton>
  );
}

export default MenuItem;
