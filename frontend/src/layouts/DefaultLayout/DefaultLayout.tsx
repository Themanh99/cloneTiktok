import React from 'react';
import Header from '../components/Header/Header'
import Sidebar from '../components/Sidebar/Sidebar'
import styles from '../DefaultLayout/DefaultLayout.module.scss'
import classNames from 'classnames/bind';
import PropTypes from 'prop-types';

const cx = classNames.bind(styles)

function DefaultLayout({ children }) {
    return (
        <div className={cx('wrapper')}>
            <Header />
            <div className={cx('container')}>
                <Sidebar />
                <div className={cx('content')}>{children}</div>
            </div>
        </div>
    );
}
DefaultLayout.propTypes = {
    children: PropTypes.node.isRequired,
}
export default DefaultLayout;