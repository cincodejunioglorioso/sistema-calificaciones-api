import { MigrationInterface, QueryRunner } from "typeorm";

export class GenerarEntidades1765421737112 implements MigrationInterface {
    name = 'GenerarEntidades1765421737112'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."docentes_nivelasignado_enum" AS ENUM('BASICA', 'BACHILLERATO', 'GLOBAL')`);
        await queryRunner.query(`CREATE TABLE "docentes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombres" character varying NOT NULL, "apellidos" character varying NOT NULL, "cedula" character varying, "telefono" character varying, "nivelAsignado" "public"."docentes_nivelasignado_enum" NOT NULL, "foto_perfil_url" character varying, "foto_titulo_url" character varying, "perfil_completo" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "usuario_id" uuid, CONSTRAINT "UQ_ceec48bf3028f7d71d736695029" UNIQUE ("cedula"), CONSTRAINT "REL_9fd711f473f0f2bf472de15268" UNIQUE ("usuario_id"), CONSTRAINT "PK_5e3b015bd4d79caf4eadbf340a7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."usuarios_rol_enum" AS ENUM('ADMIN', 'DOCENTE', 'SECRETARIA')`);
        await queryRunner.query(`CREATE TYPE "public"."usuarios_estado_enum" AS ENUM('ACTIVO', 'INACTIVO', 'PENDIENTE')`);
        await queryRunner.query(`CREATE TABLE "usuarios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "rol" "public"."usuarios_rol_enum" NOT NULL DEFAULT 'DOCENTE', "estado" "public"."usuarios_estado_enum" NOT NULL DEFAULT 'ACTIVO', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5" UNIQUE ("email"), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."periodos_lectivos_estado_enum" AS ENUM('ACTIVO', 'FINALIZADO')`);
        await queryRunner.query(`CREATE TABLE "periodos_lectivos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying NOT NULL, "fechaInicio" date NOT NULL, "fechaFin" date NOT NULL, "estado" "public"."periodos_lectivos_estado_enum" NOT NULL DEFAULT 'ACTIVO', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5422d93ecdf01f43c4b98634e02" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."trimestres_nombre_enum" AS ENUM('PRIMER TRIMESTRE', 'SEGUNDO TRIMESTRE', 'TERCER TRIMESTRE')`);
        await queryRunner.query(`CREATE TYPE "public"."trimestres_estado_enum" AS ENUM('ACTIVO', 'FINALIZADO', 'PENDIENTE')`);
        await queryRunner.query(`CREATE TABLE "trimestres" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" "public"."trimestres_nombre_enum" NOT NULL, "fechaInicio" date NOT NULL, "fechaFin" date NOT NULL, "estado" "public"."trimestres_estado_enum" NOT NULL DEFAULT 'PENDIENTE', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "periodo_lectivo_id" uuid NOT NULL, CONSTRAINT "PK_2dfcbdf13495ca2a68c842548cf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."cursos_nivel_enum" AS ENUM('OCTAVO', 'NOVENO', 'DECIMO', 'PRIMERO BACHILLERATO', 'SEGUNDO BACHILLERATO', 'TERCERO BACHILLERATO')`);
        await queryRunner.query(`CREATE TYPE "public"."cursos_especialidad_enum" AS ENUM('BASICA', 'TECNICO', 'CIENCIAS')`);
        await queryRunner.query(`CREATE TYPE "public"."cursos_estado_enum" AS ENUM('ACTIVO', 'INACTIVO')`);
        await queryRunner.query(`CREATE TABLE "cursos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nivel" "public"."cursos_nivel_enum" NOT NULL, "paralelo" character varying NOT NULL, "especialidad" "public"."cursos_especialidad_enum" NOT NULL, "estado" "public"."cursos_estado_enum" NOT NULL DEFAULT 'ACTIVO', "periodo_lectivo_id" uuid NOT NULL, "docente_id" uuid, "estudiantes_matriculados" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_391c5a635ef6b4bd0a46cb75653" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."estudiantes_estado_enum" AS ENUM('ACTIVO', 'GRADUADO', 'RETIRADO')`);
        await queryRunner.query(`CREATE TABLE "estudiantes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombres_completos" character varying NOT NULL, "estudiante_cedula" character varying NOT NULL, "estudiante_email" character varying, "fecha_de_nacimiento" date, "direccion" character varying, "padre_nombre" character varying, "padre_apellido" character varying, "padre_cedula" character varying, "madre_nombre" character varying, "madre_apellido" character varying, "madre_cedula" character varying, "viven_juntos" boolean NOT NULL DEFAULT false, "representante_nombre" character varying, "representante_apellido" character varying, "representante_telefono" character varying, "representante_telefono_auxiliar" character varying, "representante_correo" character varying, "representante_parentesco" character varying, "datos_completos" boolean NOT NULL DEFAULT false, "estado" "public"."estudiantes_estado_enum" NOT NULL DEFAULT 'ACTIVO', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_be6edc873795eae3b8a8e772e8c" UNIQUE ("estudiante_cedula"), CONSTRAINT "UQ_a80207db4b5108109fee24010b8" UNIQUE ("estudiante_email"), CONSTRAINT "PK_34e9c0289e8e3f437ec6c902f6b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."matriculas_origen_enum" AS ENUM('DISTRITO', 'MANUAL')`);
        await queryRunner.query(`CREATE TYPE "public"."matriculas_estado_enum" AS ENUM('ACTIVO', 'RETIRADO', 'INACTIVO')`);
        await queryRunner.query(`CREATE TABLE "matriculas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "numero_de_matricula" character varying NOT NULL, "estudiante_id" uuid NOT NULL, "curso_id" uuid NOT NULL, "periodo_lectivo_id" uuid NOT NULL, "fecha_retiro" date, "origen" "public"."matriculas_origen_enum" NOT NULL DEFAULT 'DISTRITO', "archivo_origen" character varying, "observaciones" text, "estado" "public"."matriculas_estado_enum" NOT NULL DEFAULT 'ACTIVO', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_3ebffa4c1e3360ba4b57cc881bf" UNIQUE ("numero_de_matricula"), CONSTRAINT "PK_4426123ba70495e947e719693b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."materias_niveleducativo_enum" AS ENUM('BASICA', 'BACHILLERATO', 'GENERAL')`);
        await queryRunner.query(`CREATE TYPE "public"."materias_trimestreaplicable_enum" AS ENUM('TODOS', 'PRIMERO', 'SEGUNDO', 'TERCERO')`);
        await queryRunner.query(`CREATE TYPE "public"."materias_estado_enum" AS ENUM('ACTIVO', 'INACTIVO')`);
        await queryRunner.query(`CREATE TABLE "materias" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying NOT NULL, "nivelEducativo" "public"."materias_niveleducativo_enum" NOT NULL, "trimestreAplicable" "public"."materias_trimestreaplicable_enum" NOT NULL, "estado" "public"."materias_estado_enum" NOT NULL DEFAULT 'ACTIVO', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3715a51974d6fcefbc528059df6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."materias_curso_estado_enum" AS ENUM('ACTIVO', 'INACTIVO')`);
        await queryRunner.query(`CREATE TABLE "materias_curso" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "materia_id" uuid NOT NULL, "curso_id" uuid NOT NULL, "docente_id" uuid, "periodo_lectivo_id" uuid NOT NULL, "estado" "public"."materias_curso_estado_enum" NOT NULL DEFAULT 'ACTIVO', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e5027e028699f0ec81483fffeb0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "docentes" ADD CONSTRAINT "FK_9fd711f473f0f2bf472de152688" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "trimestres" ADD CONSTRAINT "FK_f78557fe53353dc34626b3a2ea5" FOREIGN KEY ("periodo_lectivo_id") REFERENCES "periodos_lectivos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cursos" ADD CONSTRAINT "FK_2462e222e2e234709464df31bc6" FOREIGN KEY ("periodo_lectivo_id") REFERENCES "periodos_lectivos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cursos" ADD CONSTRAINT "FK_8c39b6011fb5a0da2a7c8f1b5dd" FOREIGN KEY ("docente_id") REFERENCES "docentes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matriculas" ADD CONSTRAINT "FK_12610cedecedccac6383361b8c0" FOREIGN KEY ("estudiante_id") REFERENCES "estudiantes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matriculas" ADD CONSTRAINT "FK_de4dc94e001d9d72471c4937c50" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matriculas" ADD CONSTRAINT "FK_bd71f878d96006eeead7b7f5d80" FOREIGN KEY ("periodo_lectivo_id") REFERENCES "periodos_lectivos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "materias_curso" ADD CONSTRAINT "FK_c8f507cef7e765cc533a23198c7" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "materias_curso" ADD CONSTRAINT "FK_84877e0a4ff0be4b67f1b16274c" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "materias_curso" ADD CONSTRAINT "FK_feff830e9610edbe55a9b6b3b32" FOREIGN KEY ("docente_id") REFERENCES "docentes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "materias_curso" ADD CONSTRAINT "FK_bf8b5544d0448fbf0a8bb31628d" FOREIGN KEY ("periodo_lectivo_id") REFERENCES "periodos_lectivos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "materias_curso" DROP CONSTRAINT "FK_bf8b5544d0448fbf0a8bb31628d"`);
        await queryRunner.query(`ALTER TABLE "materias_curso" DROP CONSTRAINT "FK_feff830e9610edbe55a9b6b3b32"`);
        await queryRunner.query(`ALTER TABLE "materias_curso" DROP CONSTRAINT "FK_84877e0a4ff0be4b67f1b16274c"`);
        await queryRunner.query(`ALTER TABLE "materias_curso" DROP CONSTRAINT "FK_c8f507cef7e765cc533a23198c7"`);
        await queryRunner.query(`ALTER TABLE "matriculas" DROP CONSTRAINT "FK_bd71f878d96006eeead7b7f5d80"`);
        await queryRunner.query(`ALTER TABLE "matriculas" DROP CONSTRAINT "FK_de4dc94e001d9d72471c4937c50"`);
        await queryRunner.query(`ALTER TABLE "matriculas" DROP CONSTRAINT "FK_12610cedecedccac6383361b8c0"`);
        await queryRunner.query(`ALTER TABLE "cursos" DROP CONSTRAINT "FK_8c39b6011fb5a0da2a7c8f1b5dd"`);
        await queryRunner.query(`ALTER TABLE "cursos" DROP CONSTRAINT "FK_2462e222e2e234709464df31bc6"`);
        await queryRunner.query(`ALTER TABLE "trimestres" DROP CONSTRAINT "FK_f78557fe53353dc34626b3a2ea5"`);
        await queryRunner.query(`ALTER TABLE "docentes" DROP CONSTRAINT "FK_9fd711f473f0f2bf472de152688"`);
        await queryRunner.query(`DROP TABLE "materias_curso"`);
        await queryRunner.query(`DROP TYPE "public"."materias_curso_estado_enum"`);
        await queryRunner.query(`DROP TABLE "materias"`);
        await queryRunner.query(`DROP TYPE "public"."materias_estado_enum"`);
        await queryRunner.query(`DROP TYPE "public"."materias_trimestreaplicable_enum"`);
        await queryRunner.query(`DROP TYPE "public"."materias_niveleducativo_enum"`);
        await queryRunner.query(`DROP TABLE "matriculas"`);
        await queryRunner.query(`DROP TYPE "public"."matriculas_estado_enum"`);
        await queryRunner.query(`DROP TYPE "public"."matriculas_origen_enum"`);
        await queryRunner.query(`DROP TABLE "estudiantes"`);
        await queryRunner.query(`DROP TYPE "public"."estudiantes_estado_enum"`);
        await queryRunner.query(`DROP TABLE "cursos"`);
        await queryRunner.query(`DROP TYPE "public"."cursos_estado_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cursos_especialidad_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cursos_nivel_enum"`);
        await queryRunner.query(`DROP TABLE "trimestres"`);
        await queryRunner.query(`DROP TYPE "public"."trimestres_estado_enum"`);
        await queryRunner.query(`DROP TYPE "public"."trimestres_nombre_enum"`);
        await queryRunner.query(`DROP TABLE "periodos_lectivos"`);
        await queryRunner.query(`DROP TYPE "public"."periodos_lectivos_estado_enum"`);
        await queryRunner.query(`DROP TABLE "usuarios"`);
        await queryRunner.query(`DROP TYPE "public"."usuarios_estado_enum"`);
        await queryRunner.query(`DROP TYPE "public"."usuarios_rol_enum"`);
        await queryRunner.query(`DROP TABLE "docentes"`);
        await queryRunner.query(`DROP TYPE "public"."docentes_nivelasignado_enum"`);
    }

}
