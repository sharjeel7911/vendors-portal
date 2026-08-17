import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserSession } from '../decorators/current-user.decorator';

interface ScopedRequest {
  user?: UserSession;
  params: Record<string, string | undefined>;
  query: Record<string, string | undefined>;
  body: Record<string, string | number | undefined>;
}

@Injectable()
export class VendorScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<ScopedRequest>();
    const user = request.user;
    if (!user || user.vendor_id === undefined || user.vendor_id === null) {
      throw new ForbiddenException('User is not associated with any vendor');
    }

    const paramVendorId = request.params.vendorId || request.params.vendor_id;
    const queryVendorId = request.query.vendorId || request.query.vendor_id;
    const bodyVendorId = request.body.vendorId || request.body.vendor_id;

    if (paramVendorId) {
      const parsed = parseInt(paramVendorId, 10);
      if (isNaN(parsed) || parsed !== user.vendor_id) {
        throw new ForbiddenException('Access denied: vendor ID mismatch');
      }
    }

    if (queryVendorId) {
      const parsed = parseInt(queryVendorId, 10);
      if (isNaN(parsed) || parsed !== user.vendor_id) {
        throw new ForbiddenException('Access denied: vendor ID mismatch');
      }
    }

    if (bodyVendorId) {
      const parsed =
        typeof bodyVendorId === 'number'
          ? bodyVendorId
          : parseInt(bodyVendorId, 10);
      if (isNaN(parsed) || parsed !== user.vendor_id) {
        throw new ForbiddenException('Access denied: vendor ID mismatch');
      }
    }

    return true;
  }
}
