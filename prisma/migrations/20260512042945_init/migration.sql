-- CreateTable
CREATE TABLE "newsletter" (
    "email" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_email_key" ON "newsletter"("email");
