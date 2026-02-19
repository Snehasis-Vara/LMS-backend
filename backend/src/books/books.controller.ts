import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto, UpdateBookDto } from './dto/book.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('books')
@Controller('api/books')
export class BooksController {
  constructor(private booksService: BooksService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create book (ADMIN only)' })
  create(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all books' })
  findAll() {
    return this.booksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get book by ID' })
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update book (ADMIN only)' })
  update(@Param('id') id: string, @Body() dto: UpdateBookDto) {
    return this.booksService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete book (ADMIN only)' })
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }

  @Post(':id/add-copies')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.LIBRARIAN)
  @ApiOperation({ summary: 'Add copies to book (ADMIN/LIBRARIAN)' })
  addCopies(@Param('id') id: string, @Body() body: { count: number }) {
    return this.booksService.addCopies(id, body.count);
  }

  @Post(':id/remove-copies')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN, Role.LIBRARIAN)
  @ApiOperation({ summary: 'Remove copies from book (ADMIN/LIBRARIAN)' })
  removeCopies(@Param('id') id: string, @Body() body: { count: number }) {
    return this.booksService.removeCopies(id, body.count);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get book statistics' })
  getStats(@Param('id') id: string) {
    return this.booksService.getStats(id);
  }
}
