import Tippy from '@tippyjs/react/headless';
import React, { useEffect, useState } from 'react';
import styles from '../Menu/Menu.module.scss';
import classNames from 'classnames/bind';
import { Wrapper as PopperWrapper } from '..';
import MenuItem, { MenuItemData } from './MenuItem';
import Header from './Header';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logOut } from '../../../services/authServices';

const cx = classNames.bind(styles);
const defaultFn = () => {};

type MenuItemType = MenuItemData & { children?: { title?: string; data: MenuItemData[] } };

type MenuProps = {
  children: React.ReactNode;
  items?: MenuItemType[];
  hideOnClick?: boolean;
  onChange?: (item: MenuItemType) => void;
};

function Menu({ children, items = [], hideOnClick = false, onChange = defaultFn }: MenuProps) {
  const [history, setHistory] = useState<Array<{ title?: string; data: MenuItemType[] }>>([{ data: items }]);
  const current = history[history.length - 1];
  const currentUser = useSelector((state: any) => state.auth.login.currentUser);
  const id = currentUser?.data.id;
  const token = currentUser?.meta.token;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useEffect(() => {
    const handleLogOut = () => {
      logOut(dispatch as any, navigate as any, undefined as any, undefined as any);
    };
    handleLogOut();
  }, [dispatch, navigate]);

  const renderItems = () => {
    return current.data.map((item, index) => {
      const isParent = !!item.children;
      return (
        <MenuItem
          key={index}
          data={item}
          onClick={() => {
            if (isParent) {
              setHistory((prev) => [...prev, item.children as any]);
            } else {
              onChange(item);
            }
          }}
        />
      );
    });
  };

  const renderResult = (attrs: any) => (
    <div className={cx('menu-lists')} tabIndex={-1} {...attrs}>
      <PopperWrapper className={cx('menu-popper')}>
        {history.length > 1 && (
          <Header
            title={current.title as string}
            onBack={() => {
              setHistory((prev) => prev.slice(0, prev.length - 1));
            }}
          />
        )}
        <div className={cx('menu-body')}>{renderItems()}</div>
      </PopperWrapper>
    </div>
  );

  const handleResetToFirstMenu = () => {
    setHistory((prev) => prev.slice(0, 1));
  };

  const trigger = React.isValidElement(children) ? children : <span>{children as any}</span>;

  return (
    <Tippy
      delay={[0, 600]}
      offset={[12, 8]}
      interactive
      hideOnClick={hideOnClick}
      placement="bottom-end"
      render={renderResult}
      onHide={handleResetToFirstMenu}
      arrow={true}
    >
      {trigger}
    </Tippy>
  );
}

export default Menu;
