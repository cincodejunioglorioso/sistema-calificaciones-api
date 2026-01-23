import { MigrationInterface, QueryRunner } from "typeorm";

export class CorreccionEntidadRecuperacionExamen1768977264951 implements MigrationInterface {
    name = 'CorreccionEntidadRecuperacionExamen1768977264951'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recuperacion_examen" DROP CONSTRAINT "FK_08886ff978053f1f448ea6d0c2a"`);
        await queryRunner.query(`ALTER TABLE "recuperacion_examen" ADD CONSTRAINT "FK_08886ff978053f1f448ea6d0c2a" FOREIGN KEY ("calificacion_examen_id") REFERENCES "calificacion_examen"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recuperacion_examen" DROP CONSTRAINT "FK_08886ff978053f1f448ea6d0c2a"`);
        await queryRunner.query(`ALTER TABLE "recuperacion_examen" ADD CONSTRAINT "FK_08886ff978053f1f448ea6d0c2a" FOREIGN KEY ("calificacion_examen_id") REFERENCES "calificacion_examen"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
