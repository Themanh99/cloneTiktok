import styles from './Discover.module.scss';
import classNames from 'classnames/bind';
import DiscoverItem from './DiscoverItem/DiscoverItem';
import PropTypes from 'prop-types';

const cx = classNames.bind(styles);

function Discover({ label }) {
    return (
        <div className={cx('Wrapper')}>
            <p className={cx('Label')}>{label}</p>
            <DiscoverItem label={'tiktok'} />
            <DiscoverItem label={'noitieng'} />
            <DiscoverItem label={'sansangthaydoi'} />
            <DiscoverItem label={'suthatla'} />
            <DiscoverItem label={'7749hieuung'} />
            <DiscoverItem label={'genzlife'} />
        </div>
    );
}

Discover.propTypes = {
    label: PropTypes.string.isRequired,
};

export default Discover;
