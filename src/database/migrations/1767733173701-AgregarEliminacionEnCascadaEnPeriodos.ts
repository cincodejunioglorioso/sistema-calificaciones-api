import { MigrationInterface, QueryRunner } from "typeorm";

export class AgregarEliminacionEnCascadaEnPeriodos1767733173701 implements MigrationInterface {
    name = 'AgregarEliminacionEnCascadaEnPeriodos1767733173701'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing foreign keys
        await queryRunner.query(`ALTER TABLE "tipos_evaluacion" DROP CONSTRAINT "FK_36bab68eb442843210f999f0bff"`);
        await queryRunner.query(`ALTER TABLE "trimestres" DROP CONSTRAINT "FK_f78557fe53353dc34626b3a2ea5"`);
        
        // Add CASCADE DELETE to foreign keys
        await queryRunner.query(`ALTER TABLE "tipos_evaluacion" ADD CONSTRAINT "FK_36bab68eb442843210f999f0bff" FOREIGN KEY ("periodo_lectivo_id") REFERENCES "periodos_lectivos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trimestres" ADD CONSTRAINT "FK_f78557fe53353dc34626b3a2ea5" FOREIGN KEY ("periodo_lectivo_id") REFERENCES "periodos_lectivos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert to original foreign keys without CASCADE
        await queryRunner.query(`ALTER TABLE "trimestres" DROP CONSTRAINT "FK_f78557fe53353dc34626b3a2ea5"`);
        await queryRunner.query(`ALTER TABLE "tipos_evaluacion" DROP CONSTRAINT "FK_36bab68eb442843210f999f0bff"`);
        
        await queryRunner.query(`ALTER TABLE "tipos_evaluacion" ADD CONSTRAINT "FK_36bab68eb442843210f999f0bff" FOREIGN KEY ("periodo_lectivo_id") REFERENCES "periodos_lectivos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trimestres" ADD CONSTRAINT "FK_f78557fe53353dc34626b3a2ea5" FOREIGN KEY ("periodo_lectivo_id") REFERENCES "periodos_lectivos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}