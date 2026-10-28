import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPayments1793150611378 implements MigrationInterface {
  name = 'AddPayments1793150611378';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'succeeded', 'failed', 'expired', 'needs_refund')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" SERIAL NOT NULL, "booking_id" integer NOT NULL, "txn_ref" character varying(64) NOT NULL, "amount" numeric NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "bank_code" character varying(20), "transaction_no" character varying(20), "response_code" character varying(2), "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "paid_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e86edf76dc2424f123b9023a2b" ON "payments"  ("booking_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_6d4f9d25ae28c532566a0ec97f" ON "payments"  ("txn_ref") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cec73c51fa9b4f11beb344b627" ON "payments"  ("status", "expires_at") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."bookings_payment_status_enum" AS ENUM('unpaid', 'paid')`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD "payment_status" "public"."bookings_payment_status_enum" NOT NULL DEFAULT 'unpaid'`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD "payment_due_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `UPDATE "bookings" SET "payment_status" = 'paid' WHERE "status" IN ('approved', 'completed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_e86edf76dc2424f123b9023a2b2" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_e86edf76dc2424f123b9023a2b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN "payment_due_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP COLUMN "payment_status"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."bookings_payment_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cec73c51fa9b4f11beb344b627"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6d4f9d25ae28c532566a0ec97f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e86edf76dc2424f123b9023a2b"`,
    );
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
  }
}
