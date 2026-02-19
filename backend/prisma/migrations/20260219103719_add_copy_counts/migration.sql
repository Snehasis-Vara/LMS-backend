-- AlterTable
ALTER TABLE "books" ADD COLUMN "totalCopies" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "books" ADD COLUMN "availableCopies" INTEGER NOT NULL DEFAULT 0;

-- Update existing books with current copy counts
UPDATE "books" b
SET "totalCopies" = (SELECT COUNT(*) FROM "book_copies" WHERE "bookId" = b.id),
    "availableCopies" = (SELECT COUNT(*) FROM "book_copies" WHERE "bookId" = b.id AND status = 'AVAILABLE');
