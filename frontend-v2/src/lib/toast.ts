import axios from 'axios';
import type { MessageInstance } from 'antd/es/message/interface';

let messageApi: MessageInstance | null = null;

export const registerMessageApi = (api: MessageInstance) => {
  messageApi = api;
  return () => {
    if (messageApi === api) messageApi = null;
  };
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const message = error.response?.data?.message;
  if (Array.isArray(message)) return message.join('. ');
  if (typeof message === 'string') return message;
  return error.message || fallback;
};

export const appToast = {
  success: (message: string) => messageApi?.success(message),
  error: (error: unknown, fallback: string) =>
    messageApi?.error(getErrorMessage(error, fallback)),
  info: (message: string) => messageApi?.info(message),
  warning: (message: string) => messageApi?.warning(message),
  loading: (message: string) => messageApi?.loading(message, 0),
  destroy: (key?: string) => messageApi?.destroy(key),
};
