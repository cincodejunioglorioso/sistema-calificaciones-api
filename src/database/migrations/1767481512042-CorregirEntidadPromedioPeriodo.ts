import { MigrationInterface, QueryRunner } from "typeorm";

export class CorregirEntidadPromedioPeriodo1767481512042 implements MigrationInterface {
    name = 'CorregirEntidadPromedioPeriodo1767481512042'


    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "promedio_operiodo"
            RENAME TO "promedio_periodo"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "promedio_periodo"
            RENAME TO "promedio_operiodo"
        `);
    }
}
