import { MigrationInterface, QueryRunner } from "typeorm";

export class AgregarNuevoEstadoEstudiante1768431147471 implements MigrationInterface {
    name = 'AgregarNuevoEstadoEstudiante1768431147471'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TYPE "public"."estudiantes_estado_enum"
            ADD VALUE IF NOT EXISTS 'INACTIVO_TEMPORAL'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

    }

}
