import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserSession {
  vendor_user_id: number;
  vendor_id: number | null;
  role: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserSession | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: UserSession }>();
    return request.user;
  },
);
