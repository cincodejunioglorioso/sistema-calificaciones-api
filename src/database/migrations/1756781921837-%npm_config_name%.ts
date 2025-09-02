import { MigrationInterface, QueryRunner } from "typeorm";

export class  CrearEntidadPeriodosLectivosYTrimestres1756781921837 implements MigrationInterface {
    name = ' CrearEntidadPeriodosLectivosYTrimestres1756781921837'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."periodos_lectivos_estado_enum" AS ENUM('ACTIVO', 'FINALIZADO')`);
        await queryRunner.query(`CREATE TABLE "periodos_lectivos" ("id" SERIAL NOT NULL, "nombre" character varying NOT NULL, "fechaInicio" date NOT NULL, "fechaFin" date NOT NULL, "estado" "public"."periodos_lectivos_estado_enum" NOT NULL DEFAULT 'ACTIVO', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5422d93ecdf01f43c4b98634e02" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."trimestres_nombre_enum" AS ENUM('PRIMER TRIMESTRE', 'SEGUNDO TRIMESTRE', 'TERCER TRIMESTRE')`);
        await queryRunner.query(`CREATE TYPE "public"."trimestres_estado_enum" AS ENUM('ACTIVO', 'FINALIZADO', 'PENDIENTE')`);
        await queryRunner.query(`CREATE TABLE "trimestres" ("id" SERIAL NOT NULL, "nombre" "public"."trimestres_nombre_enum" NOT NULL, "fechaInicio" date NOT NULL, "fechaFin" date NOT NULL, "estado" "public"."trimestres_estado_enum" NOT NULL DEFAULT 'PENDIENTE', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "periodo_lectivo_id" integer NOT NULL, CONSTRAINT "PK_2dfcbdf13495ca2a68c842548cf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "trimestres" ADD CONSTRAINT "FK_f78557fe53353dc34626b3a2ea5" FOREIGN KEY ("periodo_lectivo_id") REFERENCES "periodos_lectivos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trimestres" DROP CONSTRAINT "FK_f78557fe53353dc34626b3a2ea5"`);
        await queryRunner.query(`DROP TABLE "trimestres"`);
        await queryRunner.query(`DROP TYPE "public"."trimestres_estado_enum"`);
        await queryRunner.query(`DROP TYPE "public"."trimestres_nombre_enum"`);
        await queryRunner.query(`DROP TABLE "periodos_lectivos"`);
        await queryRunner.query(`DROP TYPE "public"."periodos_lectivos_estado_enum"`);
    }

}
