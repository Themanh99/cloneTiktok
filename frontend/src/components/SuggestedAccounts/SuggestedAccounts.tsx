import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import styles from '../SuggestedAccounts/SuggestedAccounts.module.scss';
import AccountItem from './AccountItem';
import { useEffect, useState } from 'react';
import * as userServices from '../../services/userServices';

const cx = classNames.bind(styles);

function SuggestedAccounts({ label }) {
    const [data, setData] = useState([]);
    const [allSuggestedUsers, setAllSuggestedUsers] = useState([]);
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [page] = useState(1);
    const [perPage] = useState(15);
    const [seeMore, setSeeMore] = useState(false);

    useEffect(() => {
        const getAcounts = async () => {
            const result = await userServices.getSuggested(page, perPage);
            setSuggestedUsers(result);
            const lessResult = result.slice(0, 5);
            setAllSuggestedUsers(lessResult);
            setData(lessResult);
        };

        getAcounts();
    }, [page, perPage]);

    const handleSeeMore = async () => {
        seeMore ? setData(allSuggestedUsers) : setData(suggestedUsers);
        setSeeMore(!seeMore);
    };

    return (
        <div className={cx('wrapper')}>
            <p className={cx('label')}>{label}</p>
            {data.map((data) => (
                <AccountItem key={data.id} data={data} />
            ))}

            <p className={cx('more-btn')} onClick={handleSeeMore}>
                {seeMore ? 'See less' : 'See all'}
            </p>
        </div>
    );
}

SuggestedAccounts.propTypes = {
    label: PropTypes.string.isRequired,
};

export default SuggestedAccounts;