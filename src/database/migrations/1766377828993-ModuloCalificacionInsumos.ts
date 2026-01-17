import { MigrationInterface, QueryRunner } from "typeorm";

export class ModuloCalificacionInsumos1766377828993 implements MigrationInterface {
    name = 'ModuloCalificacionInsumos1766377828993'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "calificacion_insumo" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "insumo_id" uuid NOT NULL, "estudiante_id" uuid NOT NULL, "docente_id" uuid NOT NULL, "nota_original" numeric(4,2) NOT NULL, "nota_final" numeric(4,2), "observaciones" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_98550a940b73f450c02517796ce" UNIQUE ("insumo_id", "estudiante_id"), CONSTRAINT "PK_27cac9d96cc1a4a17c7d0572823" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "calificacion_insumo" ADD CONSTRAINT "FK_6171790fd84c31c450bd9c18272" FOREIGN KEY ("insumo_id") REFERENCES "insumos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calificacion_insumo" ADD CONSTRAINT "FK_a535e472ba9fe38f564f3928f8d" FOREIGN KEY ("estudiante_id") REFERENCES "estudiantes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calificacion_insumo" ADD CONSTRAINT "FK_832d52f11722382c2fbc4b6a476" FOREIGN KEY ("docente_id") REFERENCES "docentes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calificacion_insumo" DROP CONSTRAINT "FK_832d52f11722382c2fbc4b6a476"`);
        await queryRunner.query(`ALTER TABLE "calificacion_insumo" DROP CONSTRAINT "FK_a535e472ba9fe38f564f3928f8d"`);
        await queryRunner.query(`ALTER TABLE "calificacion_insumo" DROP CONSTRAINT "FK_6171790fd84c31c450bd9c18272"`);
        await queryRunner.query(`DROP TABLE "calificacion_insumo"`);
    }

}
