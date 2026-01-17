import { MigrationInterface, QueryRunner } from "typeorm";

export class ModuloCalificacionesCompleto1766989988681 implements MigrationInterface {
    name = 'ModuloCalificacionesCompleto1766989988681'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."promedio_trimestre_cualitativa_enum" AS ENUM('DA', 'AA', 'PA', 'NA')`);
        await queryRunner.query(`CREATE TABLE "promedio_trimestre" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "estudiante_id" uuid NOT NULL, "materia_curso_id" uuid NOT NULL, "trimestre_id" uuid NOT NULL, "promedio_insumos" numeric(4,2), "ponderado_insumos" numeric(4,2), "nota_proyecto" numeric(4,2), "ponderado_proyecto" numeric(4,2), "nota_examen" numeric(4,2), "ponderado_examen" numeric(4,2), "nota_final_trimestre" numeric(4,2) NOT NULL, "cualitativa" "public"."promedio_trimestre_cualitativa_enum" NOT NULL, "observaciones" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_bd9874fe7fc2fa339acc148dd27" UNIQUE ("estudiante_id", "materia_curso_id", "trimestre_id"), CONSTRAINT "PK_eff483208f1e1fc41db6de4fe6e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."promedio_operiodo_cualitativa_anual_enum" AS ENUM('DA', 'AA', 'PA', 'NA')`);
        await queryRunner.query(`CREATE TYPE "public"."promedio_operiodo_cualitativa_final_enum" AS ENUM('DA', 'AA', 'PA', 'NA')`);
        await queryRunner.query(`CREATE TYPE "public"."promedio_operiodo_estado_enum" AS ENUM('APROBADO', 'REPROBADO', 'SUPLETORIO')`);
        await queryRunner.query(`CREATE TABLE "promedio_operiodo" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "estudiante_id" uuid NOT NULL, "materia_curso_id" uuid NOT NULL, "periodo_lectivo_id" uuid NOT NULL, "nota_trimestre_1" numeric(4,2) NOT NULL, "nota_trimestre_2" numeric(4,2) NOT NULL, "nota_trimestre_3" numeric(4,2) NOT NULL, "promedio_anual" numeric(4,2) NOT NULL, "cualitativa_anual" "public"."promedio_operiodo_cualitativa_anual_enum" NOT NULL, "nota_supletorio" numeric(4,2), "promedio_final" numeric(4,2), "cualitativa_final" "public"."promedio_operiodo_cualitativa_final_enum", "estado" "public"."promedio_operiodo_estado_enum" NOT NULL, "observaciones" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a93df3a301349532070f5d095c7" UNIQUE ("estudiante_id", "materia_curso_id", "periodo_lectivo_id"), CONSTRAINT "PK_f05a16cca81f82fc314d883971d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "calificacion_proyecto" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "estudiante_id" uuid NOT NULL, "curso_id" uuid NOT NULL, "trimestre_id" uuid NOT NULL, "docente_id" uuid NOT NULL, "calificacion_proyecto" numeric(4,2) NOT NULL, "observaciones" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_76488cbe4ba95d513a6cf2706ce" UNIQUE ("estudiante_id", "curso_id", "trimestre_id"), CONSTRAINT "PK_4ef5482d2518df91207b03699ae" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "calificacion_examen" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "estudiante_id" uuid NOT NULL, "materia_curso_id" uuid NOT NULL, "trimestre_id" uuid NOT NULL, "docente_id" uuid NOT NULL, "calificacion_examen" numeric(4,2) NOT NULL, "observaciones" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f0286c63471b540536206518a14" UNIQUE ("estudiante_id", "materia_curso_id", "trimestre_id"), CONSTRAINT "PK_7edf4d9393eb7aa2ba089a8d8be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "promedio_trimestre" ADD CONSTRAINT "FK_bf47d4453423f18490cc7d6292a" FOREIGN KEY ("estudiante_id") REFERENCES "estudiantes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "promedio_trimestre" ADD CONSTRAINT "FK_e47cd9f104abba623ebb012f9a3" FOREIGN KEY ("materia_curso_id") REFERENCES "materias_curso"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "promedio_trimestre" ADD CONSTRAINT "FK_b0dff7d0f98f1dbcd69709302c3" FOREIGN KEY ("trimestre_id") REFERENCES "trimestres"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "promedio_operiodo" ADD CONSTRAINT "FK_0a75cb3c31f017ed313ddfe1b98" FOREIGN KEY ("estudiante_id") REFERENCES "estudiantes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "promedio_operiodo" ADD CONSTRAINT "FK_b089c9a99338e6be30e2b884713" FOREIGN KEY ("materia_curso_id") REFERENCES "materias_curso"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "promedio_operiodo" ADD CONSTRAINT "FK_8dd077556b67941f3b4c9915f31" FOREIGN KEY ("periodo_lectivo_id") REFERENCES "periodos_lectivos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calificacion_proyecto" ADD CONSTRAINT "FK_df26c8e636fa84a3087f50d3999" FOREIGN KEY ("estudiante_id") REFERENCES "estudiantes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calificacion_proyecto" ADD CONSTRAINT "FK_ffe8982ab9cf876b70ada89df5a" FOREIGN KEY ("trimestre_id") REFERENCES "trimestres"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calificacion_proyecto" ADD CONSTRAINT "FK_d4057102e27776626e15bf247a4" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calificacion_proyecto" ADD CONSTRAINT "FK_80c684eb6db016f13d80a870941" FOREIGN KEY ("docente_id") REFERENCES "docentes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calificacion_examen" ADD CONSTRAINT "FK_fc0abd6e168d3d9fdae6899f877" FOREIGN KEY ("estudiante_id") REFERENCES "estudiantes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calificacion_examen" ADD CONSTRAINT "FK_98564ccb80dfd8e8895925c63b7" FOREIGN KEY ("materia_curso_id") REFERENCES "materias_curso"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calificacion_examen" ADD CONSTRAINT "FK_3b25f7eee38602d3d14e38a271e" FOREIGN KEY ("trimestre_id") REFERENCES "trimestres"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calificacion_examen" ADD CONSTRAINT "FK_aa22bab586cea93e144a2ea877b" FOREIGN KEY ("docente_id") REFERENCES "docentes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calificacion_examen" DROP CONSTRAINT "FK_aa22bab586cea93e144a2ea877b"`);
        await queryRunner.query(`ALTER TABLE "calificacion_examen" DROP CONSTRAINT "FK_3b25f7eee38602d3d14e38a271e"`);
        await queryRunner.query(`ALTER TABLE "calificacion_examen" DROP CONSTRAINT "FK_98564ccb80dfd8e8895925c63b7"`);
        await queryRunner.query(`ALTER TABLE "calificacion_examen" DROP CONSTRAINT "FK_fc0abd6e168d3d9fdae6899f877"`);
        await queryRunner.query(`ALTER TABLE "calificacion_proyecto" DROP CONSTRAINT "FK_80c684eb6db016f13d80a870941"`);
        await queryRunner.query(`ALTER TABLE "calificacion_proyecto" DROP CONSTRAINT "FK_d4057102e27776626e15bf247a4"`);
        await queryRunner.query(`ALTER TABLE "calificacion_proyecto" DROP CONSTRAINT "FK_ffe8982ab9cf876b70ada89df5a"`);
        await queryRunner.query(`ALTER TABLE "calificacion_proyecto" DROP CONSTRAINT "FK_df26c8e636fa84a3087f50d3999"`);
        await queryRunner.query(`ALTER TABLE "promedio_operiodo" DROP CONSTRAINT "FK_8dd077556b67941f3b4c9915f31"`);
        await queryRunner.query(`ALTER TABLE "promedio_operiodo" DROP CONSTRAINT "FK_b089c9a99338e6be30e2b884713"`);
        await queryRunner.query(`ALTER TABLE "promedio_operiodo" DROP CONSTRAINT "FK_0a75cb3c31f017ed313ddfe1b98"`);
        await queryRunner.query(`ALTER TABLE "promedio_trimestre" DROP CONSTRAINT "FK_b0dff7d0f98f1dbcd69709302c3"`);
        await queryRunner.query(`ALTER TABLE "promedio_trimestre" DROP CONSTRAINT "FK_e47cd9f104abba623ebb012f9a3"`);
        await queryRunner.query(`ALTER TABLE "promedio_trimestre" DROP CONSTRAINT "FK_bf47d4453423f18490cc7d6292a"`);
        await queryRunner.query(`DROP TABLE "calificacion_examen"`);
        await queryRunner.query(`DROP TABLE "calificacion_proyecto"`);
        await queryRunner.query(`DROP TABLE "promedio_operiodo"`);
        await queryRunner.query(`DROP TYPE "public"."promedio_operiodo_estado_enum"`);
        await queryRunner.query(`DROP TYPE "public"."promedio_operiodo_cualitativa_final_enum"`);
        await queryRunner.query(`DROP TYPE "public"."promedio_operiodo_cualitativa_anual_enum"`);
        await queryRunner.query(`DROP TABLE "promedio_trimestre"`);
        await queryRunner.query(`DROP TYPE "public"."promedio_trimestre_cualitativa_enum"`);
    }

}
