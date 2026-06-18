import * as httpRequest from '../routes/utils/httpRequest'

export const videosList = async (type, page) => {
    try {
        const res = await httpRequest.get(`/videos`, {
            params: {
                type,
                page,
            }
        });
        return res.data;
    } catch (error) {
        console.log(error);
    }
};

export const getAVideo = async (uuid) => {
    try {
        const res = await httpRequest.get(`/posts/`, uuid);
        return res.data;
    } catch (error) {
        console.log(error);
    }
};
