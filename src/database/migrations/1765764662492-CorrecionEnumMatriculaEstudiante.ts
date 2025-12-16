import { MigrationInterface, QueryRunner } from "typeorm";

export class CorrecionEnumMatriculaEstudiante1765764662492 implements MigrationInterface {
    name = 'CorrecionEnumMatriculaEstudiante1765764662492'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."estudiantes_estado_enum" RENAME TO "estudiantes_estado_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."estudiantes_estado_enum" AS ENUM('ACTIVO', 'SIN_MATRICULA', 'GRADUADO', 'RETIRADO')`);
        await queryRunner.query(`ALTER TABLE "estudiantes" ALTER COLUMN "estado" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "estudiantes" ALTER COLUMN "estado" TYPE "public"."estudiantes_estado_enum" USING "estado"::"text"::"public"."estudiantes_estado_enum"`);
        await queryRunner.query(`ALTER TABLE "estudiantes" ALTER COLUMN "estado" SET DEFAULT 'ACTIVO'`);
        await queryRunner.query(`DROP TYPE "public"."estudiantes_estado_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."matriculas_estado_enum" RENAME TO "matriculas_estado_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."matriculas_estado_enum" AS ENUM('ACTIVO', 'FINALIZADO', 'RETIRADO', 'ANULADO')`);
        await queryRunner.query(`ALTER TABLE "matriculas" ALTER COLUMN "estado" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matriculas" ALTER COLUMN "estado" TYPE "public"."matriculas_estado_enum" USING "estado"::"text"::"public"."matriculas_estado_enum"`);
        await queryRunner.query(`ALTER TABLE "matriculas" ALTER COLUMN "estado" SET DEFAULT 'ACTIVO'`);
        await queryRunner.query(`DROP TYPE "public"."matriculas_estado_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."matriculas_estado_enum" RENAME TO "matriculas_estado_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."matriculas_estado_enum" AS ENUM('ACTIVO', 'FINALIZADO', 'RETIRADO', 'ANULADO')`);
        await queryRunner.query(`ALTER TABLE "matriculas" ALTER COLUMN "estado" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matriculas" ALTER COLUMN "estado" TYPE "public"."matriculas_estado_enum" USING "estado"::"text"::"public"."matriculas_estado_enum"`);
        await queryRunner.query(`ALTER TABLE "matriculas" ALTER COLUMN "estado" SET DEFAULT 'ACTIVO'`);
        await queryRunner.query(`DROP TYPE "public"."matriculas_estado_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."matriculas_estado_enum_old" AS ENUM('ACTIVO', 'RETIRADO', 'INACTIVO')`);
        await queryRunner.query(`ALTER TABLE "matriculas" ALTER COLUMN "estado" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matriculas" ALTER COLUMN "estado" TYPE "public"."matriculas_estado_enum_old" USING "estado"::"text"::"public"."matriculas_estado_enum_old"`);
        await queryRunner.query(`ALTER TABLE "matriculas" ALTER COLUMN "estado" SET DEFAULT 'ACTIVO'`);
        await queryRunner.query(`DROP TYPE "public"."matriculas_estado_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."matriculas_estado_enum_old" RENAME TO "matriculas_estado_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."matriculas_estado_enum_old" AS ENUM('ACTIVO', 'RETIRADO', 'INACTIVO')`);
        await queryRunner.query(`ALTER TABLE "matriculas" ALTER COLUMN "estado" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matriculas" ALTER COLUMN "estado" TYPE "public"."matriculas_estado_enum_old" USING "estado"::"text"::"public"."matriculas_estado_enum_old"`);
        await queryRunner.query(`ALTER TABLE "matriculas" ALTER COLUMN "estado" SET DEFAULT 'ACTIVO'`);
        await queryRunner.query(`DROP TYPE "public"."matriculas_estado_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."matriculas_estado_enum_old" RENAME TO "matriculas_estado_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."estudiantes_estado_enum_old" AS ENUM('ACTIVO', 'GRADUADO', 'RETIRADO')`);
        await queryRunner.query(`ALTER TABLE "estudiantes" ALTER COLUMN "estado" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "estudiantes" ALTER COLUMN "estado" TYPE "public"."estudiantes_estado_enum_old" USING "estado"::"text"::"public"."estudiantes_estado_enum_old"`);
        await queryRunner.query(`ALTER TABLE "estudiantes" ALTER COLUMN "estado" SET DEFAULT 'ACTIVO'`);
        await queryRunner.query(`DROP TYPE "public"."estudiantes_estado_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."estudiantes_estado_enum_old" RENAME TO "estudiantes_estado_enum"`);
    }

}
