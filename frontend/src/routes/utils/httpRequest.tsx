import axios from "axios";


const httpRequest = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('TOKEN')}`,
        type: 'formData',
    },
})
export const typeVideo = {
    forYou: 'for-you',
    following: 'following',
};

export const get = async (path, options = {}) => {
    const response = await httpRequest.get(path, options)
    return response.data;
}

export const post = async (path, options = {}) => {
    const response = await httpRequest.post(path, options)
    return response.data;
}
export const Delete = async (path, options = {}) => {
    const response = await httpRequest.delete(path, options);
    return response.data;
}
export const patch = async (path, options = {}) => {
    const response = await httpRequest.patch(path, options);
    return response.data;
}

export default httpRequest;