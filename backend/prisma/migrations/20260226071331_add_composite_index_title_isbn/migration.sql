-- DropIndex
DROP INDEX "books_isbn_idx";

-- CreateIndex
CREATE INDEX "books_title_isbn_idx" ON "books"("title", "isbn");
