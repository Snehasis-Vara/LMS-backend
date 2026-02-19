import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { IssueBookDto, ReturnBookDto, RenewBookDto } from './dto/transaction.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('api/transactions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post('issue')
  @Roles(Role.ADMIN, Role.LIBRARIAN, Role.STUDENT)
  @ApiOperation({ summary: 'Issue book (All users can issue to themselves)' })
  issue(@Body() dto: IssueBookDto) {
    return this.transactionsService.issue(dto);
  }

  @Post('return')
  @Roles(Role.ADMIN, Role.LIBRARIAN, Role.STUDENT)
  @ApiOperation({ summary: 'Return book (All users)' })
  return(@Body() dto: ReturnBookDto) {
    return this.transactionsService.return(dto);
  }

  @Post('renew')
  @Roles(Role.ADMIN, Role.LIBRARIAN, Role.STUDENT)
  @ApiOperation({ summary: 'Renew book (All users)' })
  renew(@Body() dto: RenewBookDto) {
    return this.transactionsService.renew(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions' })
  findAll(@Req() req) {
    return this.transactionsService.findAll(req.user);
  }

  @Get('overdue')
  @Roles(Role.ADMIN, Role.LIBRARIAN)
  @ApiOperation({ summary: 'Get overdue transactions (Admin/Librarian only)' })
  findOverdue() {
    return this.transactionsService.findOverdue();
  }

  @Get('active/:userId')
  @ApiOperation({ summary: 'Get active transactions by user' })
  findActiveByUser(@Param('userId') userId: string, @Req() req) {
    return this.transactionsService.findActiveByUser(userId, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  findOne(@Param('id') id: string, @Req() req) {
    return this.transactionsService.findOne(id, req.user);
  }
}
