import Home from '../pages/Home/Home'
import Following from '../pages/Following/Following'
import Upload from '../pages/Upload/Upload'
import Profile from '../pages/Profile/Profile'
import Search from '../pages/Search/Search'
import Live from '../pages/Live/Live'
import Video from '../pages/Video/Video'
import HeaderOnly from '../layouts/HeaderOnly/HeaderOnly'
import config from '../config'


// không cần đăng nhập vẫn xem được
const publicRoutes = [
    { path: config.routes.home, component: Home },
    { path: config.routes.following, component: Following },
    { path: config.routes.upload, component: Upload, layout: HeaderOnly },
    { path: config.routes.profile, component: Profile },
    { path: config.routes.search, component: Search, layout: null },
    { path: config.routes.live, component: Live },
    { path: config.routes.video, component: Video },
]
// cần đăng nhập mới xem được
const privateRoutes = [

]

export { publicRoutes, privateRoutes }