import { MigrationInterface, QueryRunner } from "typeorm";

export class  PruebaCrearTablaUsuarioYDocente1755910994959 implements MigrationInterface {
    name = ' PruebaCrearTablaUsuarioYDocente1755910994959'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."docentes_nivelasignado_enum" AS ENUM('BASICA', 'BACHILLERATO')`);
        await queryRunner.query(`CREATE TABLE "docentes" ("id" SERIAL NOT NULL, "nombres" character varying NOT NULL, "apellidos" character varying NOT NULL, "cedula" character varying, "telefono" character varying, "nivelAsignado" "public"."docentes_nivelasignado_enum" NOT NULL, "foto_perfil_url" character varying, "foto_titulo_url" character varying, "perfil_completo" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "usuarioIdId" integer, CONSTRAINT "UQ_ceec48bf3028f7d71d736695029" UNIQUE ("cedula"), CONSTRAINT "REL_a291c33abab3b78ed58af649d0" UNIQUE ("usuarioIdId"), CONSTRAINT "PK_5e3b015bd4d79caf4eadbf340a7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."usuarios_rol_enum" AS ENUM('ADMIN', 'DOCENTE', 'AUTORIDAD')`);
        await queryRunner.query(`CREATE TYPE "public"."usuarios_estado_enum" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING')`);
        await queryRunner.query(`CREATE TABLE "usuarios" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "rol" "public"."usuarios_rol_enum" NOT NULL DEFAULT 'DOCENTE', "estado" "public"."usuarios_estado_enum" NOT NULL DEFAULT 'ACTIVE', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5" UNIQUE ("email"), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "docentes" ADD CONSTRAINT "FK_a291c33abab3b78ed58af649d0c" FOREIGN KEY ("usuarioIdId") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "docentes" DROP CONSTRAINT "FK_a291c33abab3b78ed58af649d0c"`);
        await queryRunner.query(`DROP TABLE "usuarios"`);
        await queryRunner.query(`DROP TYPE "public"."usuarios_estado_enum"`);
        await queryRunner.query(`DROP TYPE "public"."usuarios_rol_enum"`);
        await queryRunner.query(`DROP TABLE "docentes"`);
        await queryRunner.query(`DROP TYPE "public"."docentes_nivelasignado_enum"`);
    }

}
