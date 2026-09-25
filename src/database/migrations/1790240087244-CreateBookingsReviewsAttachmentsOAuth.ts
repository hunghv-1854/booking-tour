import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBookingsReviewsAttachmentsOAuth1790240087244 implements MigrationInterface {
  name = 'CreateBookingsReviewsAttachmentsOAuth1790240087244';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."attachments_attachable_type_enum" AS ENUM('user_avatar', 'tour_image')`,
    );
    await queryRunner.query(
      `CREATE TABLE "attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attachable_type" "public"."attachments_attachable_type_enum" NOT NULL, "attachable_id" integer NOT NULL, "url" character varying NOT NULL, "file_name" character varying NOT NULL, "file_type" character varying NOT NULL, "file_size" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."bookings_status_enum" AS ENUM('pending', 'approved', 'rejected', 'cancelled', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "bookings" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "tour_id" integer NOT NULL, "start_date" date NOT NULL, "number_of_adults" integer NOT NULL, "number_of_children" integer NOT NULL DEFAULT '0', "total_price" numeric NOT NULL, "status" "public"."bookings_status_enum" NOT NULL DEFAULT 'pending', "note" text, "reject_reason" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "reviews" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "tour_id" integer NOT NULL, "booking_id" integer, "rating" integer NOT NULL, "comment" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_bbd6ac6e3e6a8f8c6e0e8692d63" UNIQUE ("booking_id"), CONSTRAINT "REL_bbd6ac6e3e6a8f8c6e0e8692d6" UNIQUE ("booking_id"), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_oauth_accounts_provider_enum" AS ENUM('google', 'facebook')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_oauth_accounts" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "provider" "public"."user_oauth_accounts_provider_enum" NOT NULL, "provider_user_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9458665223e7b768f5e632efe49" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d786bb5ae43a5cb608f69b7627" ON "user_oauth_accounts"  ("provider", "provider_user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_64cd97487c5c42806458ab5520c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_58be2b6e3020acb14946ba493ad" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_ad8f030e70663afeb8b9e3c325f" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_bbd6ac6e3e6a8f8c6e0e8692d63" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_oauth_accounts" ADD CONSTRAINT "FK_a093a39110ecd3602d87f0e814b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_oauth_accounts" DROP CONSTRAINT "FK_a093a39110ecd3602d87f0e814b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_bbd6ac6e3e6a8f8c6e0e8692d63"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_ad8f030e70663afeb8b9e3c325f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_58be2b6e3020acb14946ba493ad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_64cd97487c5c42806458ab5520c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d786bb5ae43a5cb608f69b7627"`,
    );
    await queryRunner.query(`DROP TABLE "user_oauth_accounts"`);
    await queryRunner.query(
      `DROP TYPE "public"."user_oauth_accounts_provider_enum"`,
    );
    await queryRunner.query(`DROP TABLE "reviews"`);
    await queryRunner.query(`DROP TABLE "bookings"`);
    await queryRunner.query(`DROP TYPE "public"."bookings_status_enum"`);
    await queryRunner.query(`DROP TABLE "attachments"`);
    await queryRunner.query(
      `DROP TYPE "public"."attachments_attachable_type_enum"`,
    );
  }
}
