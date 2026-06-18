import { Injectable } from '@nestjs/common';
import { MessageCode } from '../common/constants/message-codes';

export type SupportedLanguage = 'vi' | 'en';

const messages: Record<SupportedLanguage, Partial<Record<MessageCode, string>>> = {
  vi: {
    [MessageCode.AUTH_EMAIL_EXISTS]: 'Email đã được sử dụng',
    [MessageCode.AUTH_USERNAME_EXISTS]: 'Tên người dùng đã được sử dụng',
    [MessageCode.AUTH_INVALID_CREDENTIALS]: 'Email hoặc mật khẩu không đúng',
    [MessageCode.AUTH_ACCOUNT_INACTIVE]: 'Tài khoản không hoạt động',
    [MessageCode.AUTH_INVALID_REFRESH_TOKEN]: 'Refresh token không hợp lệ',
    [MessageCode.AUTH_REFRESH_TOKEN_EXPIRED]: 'Refresh token đã hết hạn',
    [MessageCode.AUTH_INVALID_GOOGLE_TOKEN]: 'Google token không hợp lệ',
    [MessageCode.USER_NOT_FOUND]: 'Không tìm thấy người dùng',
    [MessageCode.USER_CANNOT_FOLLOW_SELF]: 'Bạn không thể tự theo dõi chính mình',
    [MessageCode.USER_ALREADY_FOLLOWED]: 'Bạn đã theo dõi người dùng này',
    [MessageCode.USER_NOT_FOLLOWED]: 'Bạn chưa theo dõi người dùng này',
    [MessageCode.VIDEO_NOT_FOUND]: 'Không tìm thấy video',
    [MessageCode.VIDEO_FORBIDDEN]: 'Bạn không có quyền xem video này',
    [MessageCode.COMMENT_NOT_FOUND]: 'Không tìm thấy bình luận',
    [MessageCode.COMMENT_FORBIDDEN]: 'Bạn không có quyền xóa bình luận này',
    [MessageCode.COMMENT_DISABLED]: 'Video này đã tắt bình luận',
    [MessageCode.COMMENT_RATE_LIMITED]: 'Bạn đang bình luận quá nhanh',
    [MessageCode.SOUND_NOT_FOUND]: 'Không tìm thấy âm thanh',
    [MessageCode.STORAGE_CONFIG_MISSING]: 'Cấu hình lưu trữ chưa đầy đủ',
  },
  en: {
    [MessageCode.AUTH_EMAIL_EXISTS]: 'Email already exists',
    [MessageCode.AUTH_USERNAME_EXISTS]: 'Username already exists',
    [MessageCode.AUTH_INVALID_CREDENTIALS]: 'Email or password is invalid',
    [MessageCode.AUTH_ACCOUNT_INACTIVE]: 'Account is not active',
    [MessageCode.AUTH_INVALID_REFRESH_TOKEN]: 'Invalid refresh token',
    [MessageCode.AUTH_REFRESH_TOKEN_EXPIRED]: 'Refresh token has expired',
    [MessageCode.AUTH_INVALID_GOOGLE_TOKEN]: 'Invalid Google token',
    [MessageCode.USER_NOT_FOUND]: 'User not found',
    [MessageCode.USER_CANNOT_FOLLOW_SELF]: 'You cannot follow yourself',
    [MessageCode.USER_ALREADY_FOLLOWED]: 'You already follow this user',
    [MessageCode.USER_NOT_FOLLOWED]: 'You do not follow this user',
    [MessageCode.VIDEO_NOT_FOUND]: 'Video not found',
    [MessageCode.VIDEO_FORBIDDEN]: 'You cannot view this video',
    [MessageCode.COMMENT_NOT_FOUND]: 'Comment not found',
    [MessageCode.COMMENT_FORBIDDEN]: 'You cannot delete this comment',
    [MessageCode.COMMENT_DISABLED]: 'Comments are disabled for this video',
    [MessageCode.COMMENT_RATE_LIMITED]: 'You are commenting too quickly',
    [MessageCode.SOUND_NOT_FOUND]: 'Sound not found',
    [MessageCode.STORAGE_CONFIG_MISSING]: 'Storage configuration is incomplete',
  },
};

@Injectable()
export class I18nService {
  resolveLanguage(value?: string | string[]): SupportedLanguage {
    const raw = Array.isArray(value) ? value[0] : value;
    return raw?.toLowerCase().startsWith('en') ? 'en' : 'vi';
  }

  translate(code: MessageCode | undefined, language: SupportedLanguage, fallback: string) {
    if (!code) return fallback;
    return messages[language][code] ?? messages.en[code] ?? fallback;
  }
}
