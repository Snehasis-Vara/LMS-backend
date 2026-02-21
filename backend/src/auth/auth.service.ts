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
      throw new NotFoundException('Email not found. Please check your email address.');
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
    try {
      this.logger.log(`📧 Sending OTP via Gmail SMTP...`);
      await this.emailService.sendOTP(dto.email, otp);
      this.logger.log(`✅ OTP email sent successfully to ${dto.email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send OTP email: ${error.message}`);
      // Delete the OTP since email failed
      await this.prisma.passwordReset.delete({ where: { id: savedOtp.id } });
      throw new BadRequestException('Failed to send OTP email. Please check your email address or try again later.');
    }

    return { 
      message: 'OTP sent to your email address. Please check your inbox.',
      email: dto.email 
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    this.logger.log(`🔍 Verifying OTP for: ${dto.email}`);
    
    const resetRecord = await this.prisma.passwordReset.findFirst({
      where: {
        email: dto.email,
        otp: dto.otp,
      },
    });

    if (!resetRecord) {
      this.logger.warn(`❌ Invalid OTP for ${dto.email}`);
      throw new BadRequestException('Invalid OTP. Please check and try again.');
    }

    if (new Date() > resetRecord.expiresAt) {
      this.logger.warn(`⏰ OTP expired for ${dto.email}`);
      await this.prisma.passwordReset.delete({ where: { id: resetRecord.id } });
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    this.logger.log(`✅ OTP verified successfully for ${dto.email}`);
    return { 
      message: 'OTP verified successfully',
      email: dto.email 
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    this.logger.log(`🔍 Resetting password for: ${dto.email}`);
    
    const resetRecord = await this.prisma.passwordReset.findFirst({
      where: {
        email: dto.email,
        otp: dto.otp,
      },
    });

    if (!resetRecord) {
      this.logger.warn(`❌ Invalid OTP for password reset: ${dto.email}`);
      throw new BadRequestException('Invalid OTP. Please verify your OTP first.');
    }

    if (new Date() > resetRecord.expiresAt) {
      this.logger.warn(`⏰ OTP expired during password reset: ${dto.email}`);
      await this.prisma.passwordReset.delete({ where: { id: resetRecord.id } });
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    this.logger.log(`🔐 Password hashed for ${dto.email}`);

    // Update user password
    await this.prisma.user.update({
      where: { email: dto.email },
      data: { password: hashedPassword },
    });
    this.logger.log(`✅ Password updated for ${dto.email}`);

    // Delete OTP record
    await this.prisma.passwordReset.delete({ where: { id: resetRecord.id } });
    this.logger.log(`🗑️  OTP deleted for ${dto.email}`);

    return { 
      message: 'Password reset successfully. You can now login with your new password.',
      email: dto.email 
    };
  }
}
