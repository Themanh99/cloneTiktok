import * as httpRequest from '../routes/utils/httpRequest'


export const getSuggested = async (page, perPage) => {
    try {
        const res = await httpRequest.get(`/users/suggested`, {
            params: {
                page,
                per_page: perPage
            }
        });
        return res.data;
    } catch (error) {
        console.log(error);
    }
};

export const getFollowingsList = async (page) => {
    try {
        const res = await httpRequest.get('me/followings', {
            params: {
                page,
            },
        });
        return res.data;
    } catch (error) {
        console.log(error);
    }
};

export const getUser = async (nickname) => {
    try {
        const res = await httpRequest.get(`users/@` + nickname);
        return res.data;
    } catch (error) {
        console.log(error);
    }
};

