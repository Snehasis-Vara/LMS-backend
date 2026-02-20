import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, VerifyOtpDto, ResetPasswordDto } from './dto/password-reset.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: 'STUDENT',
      },
    });

    const { password, ...result } = user;
    return result;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const { password, ...userWithoutPassword } = user;
    
    return {
      access_token: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    this.logger.log(`🔍 Forgot password request for: ${dto.email}`);
    
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      this.logger.warn(`❌ Email not found: ${dto.email}`);
      throw new NotFoundException('Email not found');
    }

    this.logger.log(`✅ User found: ${user.name} (${user.email})`);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.logger.log(`🔢 OTP generated: ${otp}`);

    // Set expiry to 5 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    this.logger.log(`⏰ OTP expiry set to: ${expiresAt.toISOString()}`);

    // Delete any existing OTP for this email
    const deleted = await this.prisma.passwordReset.deleteMany({
      where: { email: dto.email },
    });
    if (deleted.count > 0) {
      this.logger.log(`🗑️  Deleted ${deleted.count} old OTP(s) for ${dto.email}`);
    }

    // Save OTP
    const savedOtp = await this.prisma.passwordReset.create({
      data: {
        email: dto.email,
        otp,
        expiresAt,
      },
    });
    this.logger.log(`💾 OTP saved in DB with ID: ${savedOtp.id}`);

    // Send OTP via email
    this.logger.log(`📧 Sending OTP via email...`);
    await this.emailService.sendOTP(dto.email, otp);

    return { message: 'OTP sent to your email' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const resetRecord = await this.prisma.passwordReset.findFirst({
      where: {
        email: dto.email,
        otp: dto.otp,
      },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid OTP');
    }

    if (new Date() > resetRecord.expiresAt) {
      await this.prisma.passwordReset.delete({ where: { id: resetRecord.id } });
      throw new BadRequestException('OTP has expired');
    }

    return { message: 'OTP verified successfully' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetRecord = await this.prisma.passwordReset.findFirst({
      where: {
        email: dto.email,
        otp: dto.otp,
      },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid OTP');
    }

    if (new Date() > resetRecord.expiresAt) {
      await this.prisma.passwordReset.delete({ where: { id: resetRecord.id } });
      throw new BadRequestException('OTP has expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Update user password
    await this.prisma.user.update({
      where: { email: dto.email },
      data: { password: hashedPassword },
    });

    // Delete OTP record
    await this.prisma.passwordReset.delete({ where: { id: resetRecord.id } });

    return { message: 'Password reset successfully' };
  }
}
