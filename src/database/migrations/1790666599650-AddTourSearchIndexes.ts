import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTourSearchIndexes1790666599650 implements MigrationInterface {
  name = 'AddTourSearchIndexes1790666599650';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_418b716a9043b7a66cfa8d22db" ON "attachments"  ("attachable_type", "attachable_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_facd344449ad26f464e9681c0a" ON "tours"  ("category_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_28cce8377be404b2c3f0d5256a" ON "tours"  ("price") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3eada49e0abb40390dde2c44dc" ON "tours"  ("location") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7205685ccb3e250cdf9c968d5d" ON "tours"  ("start_date", "end_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ad8f030e70663afeb8b9e3c325" ON "reviews"  ("tour_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ad8f030e70663afeb8b9e3c325"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7205685ccb3e250cdf9c968d5d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3eada49e0abb40390dde2c44dc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_28cce8377be404b2c3f0d5256a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_facd344449ad26f464e9681c0a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_418b716a9043b7a66cfa8d22db"`,
    );
  }
}
