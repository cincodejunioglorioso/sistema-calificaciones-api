import { MigrationInterface, QueryRunner } from "typeorm";

export class ModuloRecuperacionInsumos1766427475369 implements MigrationInterface {
    name = 'ModuloRecuperacionInsumos1766427475369'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "recuperacion_insumo" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "calificacion_insumo_id" uuid NOT NULL, "nota_recuperacion" numeric(4,2) NOT NULL, "intento" integer NOT NULL, "observaciones" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0dfdf35fe1bbe5764d45bcce374" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "recuperacion_insumo" ADD CONSTRAINT "FK_6184280c96b9103f5b7fe977c71" FOREIGN KEY ("calificacion_insumo_id") REFERENCES "calificacion_insumo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recuperacion_insumo" DROP CONSTRAINT "FK_6184280c96b9103f5b7fe977c71"`);
        await queryRunner.query(`DROP TABLE "recuperacion_insumo"`);
    }

}
