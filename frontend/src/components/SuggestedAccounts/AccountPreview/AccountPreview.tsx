import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import Button from '../../../components/Button/Button';
import styles from '../AccountPreview/AccountPreview.module.scss';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const cx = classNames.bind(styles);

function AccountPreview({ data }) {
  return (
    <div className={cx('wrapper')}>
      <div className={cx('header')}>
        <img className={cx('avatar')} src={data.avatar} alt={data.nickname} />
        <Button
          className={cx('follow-btn')}
          primary
          to={undefined}
          href={undefined}
          leftIcon={null}
          rightIcon={null}
          onClick={() => {}}
        >
          Follow
        </Button>
      </div>
      <div className={cx('body')}>
        <Link to={`/@${data.nickname}`} className={cx('nickname')}>
          <strong>{data.nickname}</strong>
          {data.tick && <FontAwesomeIcon className={cx('check')} icon={faCheckCircle} />}
        </Link>
        <p className={cx('name')}>{`${data.first_name} ${data.last_name}`}</p>
        <p className={cx('analytics')}>
          <strong className={cx('value')}>{data.followers_count}</strong>
          <span className={cx('label')}>Followers</span>
          <strong className={cx('value')}>{data.likes_count}</strong>
          <span className={cx('label')}>Likes</span>
        </p>
      </div>
    </div>
  );
}
AccountPreview.propTypes = {
  data: PropTypes.object.isRequired,
};
export default AccountPreview;
