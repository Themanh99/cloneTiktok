import { ExecutionContext, createParamDecorator } from '@nestjs/common';

// Custom decorator: Extracts the current user from the request object.
// Instead of writing: request.user (requires importing Request, type casting...)
// You simply use: @CurrentUser() user or @CurrentUser('id') userId
//
// How it works:
// 1. JWT Guard verifies the token → attaches user to request.user
// 2. @CurrentUser() reads request.user and returns it
export const CurrentUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return data ? user?.[data] : user;
});
