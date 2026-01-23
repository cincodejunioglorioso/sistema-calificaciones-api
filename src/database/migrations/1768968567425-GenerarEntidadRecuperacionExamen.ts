import { MigrationInterface, QueryRunner } from "typeorm";

export class GenerarEntidadRecuperacionExamen1768968567425 implements MigrationInterface {
    name = 'GenerarEntidadRecuperacionExamen1768968567425'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "recuperacion_examen" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "calificacion_examen_id" uuid NOT NULL, "segundo_examen" numeric(4,2), "trabajo_refuerzo" numeric(4,2), "observaciones" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d205ca4e16b198ecc880f4f45f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "calificacion_examen" ADD "calificacion_original" numeric(4,2)`);
        await queryRunner.query(`ALTER TABLE "recuperacion_examen" ADD CONSTRAINT "FK_08886ff978053f1f448ea6d0c2a" FOREIGN KEY ("calificacion_examen_id") REFERENCES "calificacion_examen"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recuperacion_examen" DROP CONSTRAINT "FK_08886ff978053f1f448ea6d0c2a"`);
        await queryRunner.query(`ALTER TABLE "calificacion_examen" DROP COLUMN "calificacion_original"`);
        await queryRunner.query(`DROP TABLE "recuperacion_examen"`);
    }

}
