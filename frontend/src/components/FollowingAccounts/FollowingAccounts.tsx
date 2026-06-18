import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { useEffect, useState } from 'react';
import styles from '../FollowingAccounts/FollowingAccounts.module.scss';
import AccountItem from '../AccountItem/AccountItem';
import * as userServices from '../../services/userServices';

const cx = classNames.bind(styles);

function FollowingAccounts({ label }) {
    const [data, setData] = useState([]);
    const [allFollowingedUsers, setAllFollowingUsers] = useState([]);
    const [followingUsers, setFollowingUsers] = useState([]);
    const [page] = useState(1);
    const [seeMore, setSeeMore] = useState(false);

    useEffect(() => {
        const getAcounts = async () => {
            const result = await userServices.getSuggested(page, 20);
            setFollowingUsers(result);
            const lessResult = result.slice(0, 5);
            setAllFollowingUsers(lessResult);
            setData(lessResult);
        };

        getAcounts();
    }, [page]);

    const handleSeeMore = async () => {
        seeMore ? setData(allFollowingedUsers) : setData(followingUsers);
        setSeeMore(!seeMore);
    };
    return (
        <div className={cx('wrapper')}>
            <p className={cx('label')}>{label}</p>

            {data.map((data) => (
                <AccountItem key={data.id} data={data} />
            ))}

            <p className={cx('more-btn')} onClick={handleSeeMore}>
                {seeMore ? '   See less' : 'See all'}
            </p>
        </div>
    );
}

FollowingAccounts.propTypes = {
    label: PropTypes.string.isRequired,
};

export default FollowingAccounts;