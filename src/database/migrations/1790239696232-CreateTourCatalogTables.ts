import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTourCatalogTables1790239696232 implements MigrationInterface {
  name = 'CreateTourCatalogTables1790239696232';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE ("slug"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tours" ("id" SERIAL NOT NULL, "category_id" integer NOT NULL, "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" text NOT NULL, "price" numeric NOT NULL, "duration" integer NOT NULL, "location" character varying NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "max_slot" integer NOT NULL, "available_slot" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_233c6bf8b7c2c897c6eed5373a6" UNIQUE ("slug"), CONSTRAINT "PK_2202ba445792c1ad0edf2de8de2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tour_itineraries" ("id" SERIAL NOT NULL, "tour_id" integer NOT NULL, "day_number" integer NOT NULL, "title" character varying NOT NULL, "description" text, CONSTRAINT "PK_74586817c106b4e2b67e473ad10" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "tours" ADD CONSTRAINT "FK_facd344449ad26f464e9681c0ab" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tour_itineraries" ADD CONSTRAINT "FK_04da3c0e524fbc72d0753206bb2" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tour_itineraries" DROP CONSTRAINT "FK_04da3c0e524fbc72d0753206bb2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tours" DROP CONSTRAINT "FK_facd344449ad26f464e9681c0ab"`,
    );
    await queryRunner.query(`DROP TABLE "tour_itineraries"`);
    await queryRunner.query(`DROP TABLE "tours"`);
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
