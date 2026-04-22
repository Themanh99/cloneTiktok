import { ExecutionContext, createParamDecorator } from '@nestjs/common';

// Custom decorator: Lấy user hiện tại từ request
// Thay vì viết: request.user (phải import Request, cast type...)
// Bạn chỉ cần: @CurrentUser() user: User
//
// Cách hoạt động:
// 1. JWT Guard verify token → gắn user vào request.user
// 2. @CurrentUser() đọc request.user và trả về
export const CurrentUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return data ? user?.[data] : user;
});
