import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto, UpdateBookDto } from './dto/book.dto';

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBookDto) {
    const existing = await this.prisma.book.findUnique({
      where: { isbn: dto.isbn },
    });

    if (existing) {
      throw new ConflictException('ISBN already exists');
    }

    return this.prisma.book.create({ data: dto });
  }

  async findAll() {
    return this.prisma.book.findMany({
      include: {
        copies: true,
      },
    });
  }

  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        copies: true,
      },
    });

    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  async update(id: string, dto: UpdateBookDto) {
    await this.findOne(id);
    return this.prisma.book.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.book.delete({ where: { id } });
    return { message: 'Book deleted successfully' };
  }

  async addCopies(id: string, count: number) {
    if (count < 1 || count > 100) {
      throw new BadRequestException('Count must be between 1 and 100');
    }

    const book = await this.findOne(id);

    await this.prisma.$transaction([
      ...Array.from({ length: count }).map(() =>
        this.prisma.bookCopy.create({ data: { bookId: id } })
      ),
      this.prisma.book.update({
        where: { id },
        data: {
          totalCopies: { increment: count },
          availableCopies: { increment: count },
        },
      }),
    ]);

    return { message: `Added ${count} copies to ${book.title}`, count };
  }

  async removeCopies(id: string, count: number) {
    if (count < 1) {
      throw new BadRequestException('Count must be at least 1');
    }

    const book = await this.findOne(id);

    if (book.availableCopies < count) {
      throw new BadRequestException(
        `Cannot remove ${count} copies. Only ${book.availableCopies} available copies exist.`
      );
    }

    // Get available copies to delete
    const copiesToDelete = await this.prisma.bookCopy.findMany({
      where: { bookId: id, status: 'AVAILABLE' },
      take: count,
    });

    await this.prisma.$transaction([
      ...copiesToDelete.map((copy) =>
        this.prisma.bookCopy.delete({ where: { id: copy.id } })
      ),
      this.prisma.book.update({
        where: { id },
        data: {
          totalCopies: { decrement: count },
          availableCopies: { decrement: count },
        },
      }),
    ]);

    return { message: `Removed ${count} copies from ${book.title}`, count };
  }

  async getStats(id: string) {
    const book = await this.findOne(id);
    
    const issuedCount = await this.prisma.transaction.count({
      where: {
        bookCopy: { bookId: id },
        status: { in: ['ISSUED', 'OVERDUE'] },
      },
    });

    return {
      id: book.id,
      title: book.title,
      author: book.author,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      issuedCopies: issuedCount,
    };
  }
}
