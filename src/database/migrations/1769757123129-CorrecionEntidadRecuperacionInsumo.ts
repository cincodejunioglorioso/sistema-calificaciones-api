import { MigrationInterface, QueryRunner } from "typeorm";

export class CorrecionEntidadRecuperacionInsumo1769757123129 implements MigrationInterface {
    name = 'CorrecionEntidadRecuperacionInsumo1769757123129'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recuperacion_insumo" DROP CONSTRAINT "FK_6184280c96b9103f5b7fe977c71"`);
        await queryRunner.query(`ALTER TABLE "recuperacion_insumo" ADD CONSTRAINT "FK_6184280c96b9103f5b7fe977c71" FOREIGN KEY ("calificacion_insumo_id") REFERENCES "calificacion_insumo"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recuperacion_insumo" DROP CONSTRAINT "FK_6184280c96b9103f5b7fe977c71"`);
        await queryRunner.query(`ALTER TABLE "recuperacion_insumo" ADD CONSTRAINT "FK_6184280c96b9103f5b7fe977c71" FOREIGN KEY ("calificacion_insumo_id") REFERENCES "calificacion_insumo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
