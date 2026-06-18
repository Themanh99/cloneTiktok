import React from 'react';
import styles from '../Menu/Menu.module.scss';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

type HeaderProps = {
  title: string;
  onBack: () => void;
};

function Header({ title, onBack }: HeaderProps) {
  return (
    <header className={cx('header')}>
      <button className={cx('back-btn')} onClick={onBack}>
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>
      <h4 className={cx('header-title')}>{title}</h4>
    </header>
  );
}

export default Header;
