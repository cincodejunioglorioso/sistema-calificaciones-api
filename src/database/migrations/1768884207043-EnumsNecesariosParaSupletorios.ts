import { MigrationInterface, QueryRunner } from "typeorm";

export class EnumsNecesariosParaSupletorios1768884207043 implements MigrationInterface {
    name = 'EnumsNecesariosParaSupletorios1768884207043'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."periodos_lectivos_estado_enum" RENAME TO "periodos_lectivos_estado_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."periodos_lectivos_estado_enum" AS ENUM('ACTIVO', 'SUPLETORIOS', 'SUPLETORIOS_CERRADOS', 'FINALIZADO')`);
        await queryRunner.query(`ALTER TABLE "periodos_lectivos" ALTER COLUMN "estado" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "periodos_lectivos" ALTER COLUMN "estado" TYPE "public"."periodos_lectivos_estado_enum" USING "estado"::"text"::"public"."periodos_lectivos_estado_enum"`);
        await queryRunner.query(`ALTER TABLE "periodos_lectivos" ALTER COLUMN "estado" SET DEFAULT 'ACTIVO'`);
        await queryRunner.query(`DROP TYPE "public"."periodos_lectivos_estado_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."periodos_lectivos_estado_enum_old" AS ENUM('ACTIVO', 'FINALIZADO')`);
        await queryRunner.query(`ALTER TABLE "periodos_lectivos" ALTER COLUMN "estado" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "periodos_lectivos" ALTER COLUMN "estado" TYPE "public"."periodos_lectivos_estado_enum_old" USING "estado"::"text"::"public"."periodos_lectivos_estado_enum_old"`);
        await queryRunner.query(`ALTER TABLE "periodos_lectivos" ALTER COLUMN "estado" SET DEFAULT 'ACTIVO'`);
        await queryRunner.query(`DROP TYPE "public"."periodos_lectivos_estado_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."periodos_lectivos_estado_enum_old" RENAME TO "periodos_lectivos_estado_enum"`);
    }

}
