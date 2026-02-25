import { IsString, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SearchBooksDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => value ? parseInt(value) : 0)
  skip?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => value ? parseInt(value) : 3)
  limit?: number;
}

export class CreateBookDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  author: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  isbn: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty()
  @IsInt()
  publishedYear: number;
}

export class UpdateBookDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  isbn?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  publishedYear?: number;
}
