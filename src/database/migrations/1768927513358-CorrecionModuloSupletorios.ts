import { MigrationInterface, QueryRunner } from "typeorm";

export class CorrecionModuloSupletorios1768927513358 implements MigrationInterface {
    name = 'CorrecionModuloSupletorios1768927513358'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."periodos_lectivos_estado_supletorio_enum" AS ENUM('PENDIENTE', 'ACTIVADO', 'CERRADO')`);
        await queryRunner.query(`ALTER TABLE "periodos_lectivos" ADD "estado_supletorio" "public"."periodos_lectivos_estado_supletorio_enum" NOT NULL DEFAULT 'PENDIENTE'`);
        await queryRunner.query(`ALTER TYPE "public"."periodos_lectivos_estado_enum" RENAME TO "periodos_lectivos_estado_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."periodos_lectivos_estado_enum" AS ENUM('ACTIVO', 'FINALIZADO')`);
        await queryRunner.query(`ALTER TABLE "periodos_lectivos" ALTER COLUMN "estado" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "periodos_lectivos" ALTER COLUMN "estado" TYPE "public"."periodos_lectivos_estado_enum" USING "estado"::"text"::"public"."periodos_lectivos_estado_enum"`);
        await queryRunner.query(`ALTER TABLE "periodos_lectivos" ALTER COLUMN "estado" SET DEFAULT 'ACTIVO'`);
        await queryRunner.query(`DROP TYPE "public"."periodos_lectivos_estado_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."periodos_lectivos_estado_enum_old" AS ENUM('ACTIVO', 'SUPLETORIOS', 'SUPLETORIOS_CERRADOS', 'FINALIZADO')`);
        await queryRunner.query(`ALTER TABLE "periodos_lectivos" ALTER COLUMN "estado" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "periodos_lectivos" ALTER COLUMN "estado" TYPE "public"."periodos_lectivos_estado_enum_old" USING "estado"::"text"::"public"."periodos_lectivos_estado_enum_old"`);
        await queryRunner.query(`ALTER TABLE "periodos_lectivos" ALTER COLUMN "estado" SET DEFAULT 'ACTIVO'`);
        await queryRunner.query(`DROP TYPE "public"."periodos_lectivos_estado_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."periodos_lectivos_estado_enum_old" RENAME TO "periodos_lectivos_estado_enum"`);
        await queryRunner.query(`ALTER TABLE "periodos_lectivos" DROP COLUMN "estado_supletorio"`);
        await queryRunner.query(`DROP TYPE "public"."periodos_lectivos_estado_supletorio_enum"`);
    }

}
