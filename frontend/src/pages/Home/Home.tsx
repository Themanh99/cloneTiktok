import WrapperVideos from "../../components/WrapperVideos/WrapperVideos";
import classNames from "classnames/bind";
import styles from './Home.module.scss';

const cx = classNames.bind(styles);

function Home() {
    return (
        <div className={cx('wrapper')} style={{ paddingTop: 24, paddingBottom: 24, paddingLeft: 16, paddingRight: 16 }}>
            <WrapperVideos />
        </div>
    );
}

export default Home;