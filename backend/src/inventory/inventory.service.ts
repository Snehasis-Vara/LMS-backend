import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookCopyDto, UpdateBookCopyDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBookCopyDto) {
    const book = await this.prisma.book.findUnique({
      where: { id: dto.bookId },
    });

    if (!book) throw new NotFoundException('Book not found');

    const [copy] = await this.prisma.$transaction([
      this.prisma.bookCopy.create({
        data: dto,
        include: { book: true },
      }),
      this.prisma.book.update({
        where: { id: dto.bookId },
        data: {
          totalCopies: { increment: 1 },
          availableCopies: { increment: 1 },
        },
      }),
    ]);

    return copy;
  }

  async createBulk(bookId: string, count: number) {
    if (count < 1 || count > 100) {
      throw new BadRequestException('Count must be between 1 and 100');
    }

    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) throw new NotFoundException('Book not found');

    const copies = await this.prisma.$transaction([
      ...Array.from({ length: count }).map(() =>
        this.prisma.bookCopy.create({
          data: { bookId },
          include: { book: true },
        }),
      ),
      this.prisma.book.update({
        where: { id: bookId },
        data: {
          totalCopies: { increment: count },
          availableCopies: { increment: count },
        },
      }),
    ]);

    return { message: `Created ${count} copies`, copies: copies.slice(0, -1) };
  }

  async findAll() {
    return this.prisma.bookCopy.findMany({
      include: { book: true },
    });
  }

  async getSummary() {
    const total = await this.prisma.bookCopy.count();
    const available = await this.prisma.bookCopy.count({
      where: { status: 'AVAILABLE' },
    });
    const issued = await this.prisma.bookCopy.count({
      where: { status: 'ISSUED' },
    });
    const lost = await this.prisma.bookCopy.count({
      where: { status: 'LOST' },
    });

    return { total, available, issued, lost };
  }

  async findOne(id: string) {
    const copy = await this.prisma.bookCopy.findUnique({
      where: { id },
      include: { book: true },
    });

    if (!copy) throw new NotFoundException('Book copy not found');
    return copy;
  }

  async update(id: string, dto: UpdateBookCopyDto) {
    await this.findOne(id);
    return this.prisma.bookCopy.update({
      where: { id },
      data: dto,
      include: { book: true },
    });
  }

  async remove(id: string) {
    const copy = await this.findOne(id);
    
    await this.prisma.$transaction([
      this.prisma.bookCopy.delete({ where: { id } }),
      this.prisma.book.update({
        where: { id: copy.bookId },
        data: {
          totalCopies: { decrement: 1 },
          availableCopies: copy.status === 'AVAILABLE' ? { decrement: 1 } : undefined,
        },
      }),
    ]);
    
    return { message: 'Book copy deleted successfully' };
  }
}
