/*
  Warnings:

  - You are about to drop the column `facebook_url` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `telegram_username` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `zalo_phone` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "facebook_url",
DROP COLUMN "telegram_username",
DROP COLUMN "zalo_phone",
ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "zalo" TEXT;
