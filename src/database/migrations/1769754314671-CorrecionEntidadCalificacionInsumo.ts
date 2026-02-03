import { MigrationInterface, QueryRunner } from "typeorm";

export class CorrecionEntidadCalificacionInsumo1769754314671 implements MigrationInterface {
    name = 'CorrecionEntidadCalificacionInsumo1769754314671'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calificacion_insumo" DROP CONSTRAINT "FK_6171790fd84c31c450bd9c18272"`);
        await queryRunner.query(`ALTER TABLE "calificacion_insumo" ADD CONSTRAINT "FK_6171790fd84c31c450bd9c18272" FOREIGN KEY ("insumo_id") REFERENCES "insumos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calificacion_insumo" DROP CONSTRAINT "FK_6171790fd84c31c450bd9c18272"`);
        await queryRunner.query(`ALTER TABLE "calificacion_insumo" ADD CONSTRAINT "FK_6171790fd84c31c450bd9c18272" FOREIGN KEY ("insumo_id") REFERENCES "insumos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
