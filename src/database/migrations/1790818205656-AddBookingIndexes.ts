import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingIndexes1790818205656 implements MigrationInterface {
  name = 'AddBookingIndexes1790818205656';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_64cd97487c5c42806458ab5520" ON "bookings"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_48b267d894e32a25ebde4b207a" ON "bookings"  ("status") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_48b267d894e32a25ebde4b207a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_64cd97487c5c42806458ab5520"`,
    );
  }
}
