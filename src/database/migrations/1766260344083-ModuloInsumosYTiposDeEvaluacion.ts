import { MigrationInterface, QueryRunner } from "typeorm";

export class ModuloInsumosYTiposDeEvaluacion1766260344083 implements MigrationInterface {
    name = 'ModuloInsumosYTiposDeEvaluacion1766260344083'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."tipos_evaluacion_nombre_enum" AS ENUM('INSUMOS', 'PROYECTO', 'EXAMEN')`);
        await queryRunner.query(`CREATE TABLE "tipos_evaluacion" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "periodo_lectivo_id" uuid NOT NULL, "nombre" "public"."tipos_evaluacion_nombre_enum" NOT NULL, "porcentaje" numeric(5,2) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d3afdae6c5387ea16014ab68be2" UNIQUE ("periodo_lectivo_id", "nombre"), CONSTRAINT "PK_6fbc365dba404918d499603ccdb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."insumos_estado_enum" AS ENUM('ACTIVO', 'BORRADOR', 'PUBLICADO', 'CERRADO')`);
        await queryRunner.query(`CREATE TABLE "insumos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "materia_curso_id" uuid NOT NULL, "trimestre_id" uuid NOT NULL, "docente_id" uuid NOT NULL, "nombre" character varying NOT NULL, "estado" "public"."insumos_estado_enum" NOT NULL DEFAULT 'BORRADOR', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b4e1b727a7b140e698e3a3dc7af" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "tipos_evaluacion" ADD CONSTRAINT "FK_36bab68eb442843210f999f0bff" FOREIGN KEY ("periodo_lectivo_id") REFERENCES "periodos_lectivos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insumos" ADD CONSTRAINT "FK_0922d53d1d89e1c0fc7f5a32520" FOREIGN KEY ("materia_curso_id") REFERENCES "materias_curso"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insumos" ADD CONSTRAINT "FK_ca616f37420a05cfee3d6bf0c62" FOREIGN KEY ("trimestre_id") REFERENCES "trimestres"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insumos" ADD CONSTRAINT "FK_e18815d1c9e73f0931bc3dbb7c0" FOREIGN KEY ("docente_id") REFERENCES "docentes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "insumos" DROP CONSTRAINT "FK_e18815d1c9e73f0931bc3dbb7c0"`);
        await queryRunner.query(`ALTER TABLE "insumos" DROP CONSTRAINT "FK_ca616f37420a05cfee3d6bf0c62"`);
        await queryRunner.query(`ALTER TABLE "insumos" DROP CONSTRAINT "FK_0922d53d1d89e1c0fc7f5a32520"`);
        await queryRunner.query(`ALTER TABLE "tipos_evaluacion" DROP CONSTRAINT "FK_36bab68eb442843210f999f0bff"`);
        await queryRunner.query(`DROP TABLE "insumos"`);
        await queryRunner.query(`DROP TYPE "public"."insumos_estado_enum"`);
        await queryRunner.query(`DROP TABLE "tipos_evaluacion"`);
        await queryRunner.query(`DROP TYPE "public"."tipos_evaluacion_nombre_enum"`);
    }

}
