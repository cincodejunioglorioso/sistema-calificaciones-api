import { MigrationInterface, QueryRunner } from "typeorm";

export class  CrearEntidadMaterias1756494187608 implements MigrationInterface {
    name = ' CrearEntidadMaterias1756494187608'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."materias_niveleducativo_enum" AS ENUM('BASICA', 'BACHILLERATO', 'AMBOS')`);
        await queryRunner.query(`CREATE TYPE "public"."materias_trimestreaplicable_enum" AS ENUM('TODOS', 'PRIMERO', 'SEGUNDO', 'TERCERO')`);
        await queryRunner.query(`CREATE TYPE "public"."materias_estado_enum" AS ENUM('ACTIVA', 'INACTIVA')`);
        await queryRunner.query(`CREATE TABLE "materias" ("id" SERIAL NOT NULL, "nombre" character varying NOT NULL, "nivelEducativo" "public"."materias_niveleducativo_enum" NOT NULL, "trimestreAplicable" "public"."materias_trimestreaplicable_enum" NOT NULL, "estado" "public"."materias_estado_enum" NOT NULL DEFAULT 'ACTIVA', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3715a51974d6fcefbc528059df6" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "materias"`);
        await queryRunner.query(`DROP TYPE "public"."materias_estado_enum"`);
        await queryRunner.query(`DROP TYPE "public"."materias_trimestreaplicable_enum"`);
        await queryRunner.query(`DROP TYPE "public"."materias_niveleducativo_enum"`);
    }

}
