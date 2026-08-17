import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  vendorId: number | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await this.prisma.vendor_users.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    // Get max IDs to handle missing autoincrement in Prisma schema
    const maxVendor = await this.prisma.vendors.findFirst({
      orderBy: { id: 'desc' },
    });
    const nextVendorId = (maxVendor?.id || 0) + 1;

    const maxUser = await this.prisma.vendor_users.findFirst({
      orderBy: { id: 'desc' },
    });
    const nextUserId = (maxUser?.id || 0) + 1;

    // Use a transaction to create vendor and owner user
    return this.prisma.$transaction(async (tx) => {
      const vendor = await tx.vendors.create({
        data: {
          id: nextVendorId,
          business_name: registerDto.businessName,
          email,
          status: 'pending',
          created_at: new Date(),
        },
      });

      const user = await tx.vendor_users.create({
        data: {
          id: nextUserId,
          vendor_id: vendor.id,
          name: registerDto.name,
          email,
          password: passwordHash,
          role: 'owner',
          status: 'active',
          created_at: new Date(),
        },
      });

      return {
        id: user.id,
        vendor_id: user.vendor_id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
      };
    });
  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.toLowerCase().trim();

    const user = await this.prisma.vendor_users.findUnique({
      where: { email },
      include: { vendors: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check vendor status (must be approved, unless it's pending/rejected)
    if (!user.vendors || user.vendors.status !== 'approved') {
      throw new UnauthorizedException(
        'Your business account is pending admin approval.',
      );
    }

    // Generate tokens
    const tokens = this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.vendor_id,
    );

    // Store refresh token hash
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        vendor_id: user.vendor_id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
      });

      // Find token in database
      const storedTokens = await this.prisma.refresh_tokens.findMany({
        where: { user_id: payload.sub },
      });

      let validTokenFound = false;
      let tokenIdToDelete = -1;

      for (const t of storedTokens) {
        const isMatch = await bcrypt.compare(refreshToken, t.token_hash);
        if (isMatch && t.expires_at > new Date()) {
          validTokenFound = true;
          tokenIdToDelete = t.id;
          break;
        }
      }

      if (!validTokenFound) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Delete old refresh token (rotation)
      await this.prisma.refresh_tokens.delete({
        where: { id: tokenIdToDelete },
      });

      const user = await this.prisma.vendor_users.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tokens = this.generateTokens(
        user.id,
        user.email,
        user.role,
        user.vendor_id,
      );
      await this.saveRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
        ignoreExpiration: true,
      });

      const storedTokens = await this.prisma.refresh_tokens.findMany({
        where: { user_id: payload.sub },
      });

      for (const t of storedTokens) {
        const isMatch = await bcrypt.compare(refreshToken, t.token_hash);
        if (isMatch) {
          await this.prisma.refresh_tokens.delete({
            where: { id: t.id },
          });
        }
      }
    } catch {
      // Ignore errors on logout
    }
  }

  async getUserById(userId: number) {
    const user = await this.prisma.vendor_users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        vendor_id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        created_at: true,
      },
    });
    return user;
  }

  private generateTokens(
    userId: number,
    email: string,
    role: string,
    vendorId: number | null,
  ) {
    const payload = { sub: userId, email, role, vendorId };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'fallback-access-secret',
      expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as unknown as number,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as unknown as number,
    });

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: number, token: string) {
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refresh_tokens.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });
  }
}
