import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


export enum NivelEducativo {
    BASICA = 'BASICA',
    BACHILLERATO = 'BACHILLERATO',
    GENERAL = 'GENERAL',
}

export enum TipoCalificacion {
    CUALITATIVA = 'CUALITATIVA',
    CUANTITATIVA = 'CUANTITATIVA',
}

export enum EstadoMateria {
    ACTIVO = 'ACTIVO',
    INACTIVO = 'INACTIVO',
}

@Entity('materias')
export class Materia {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    nombre: string;

    @Column({ type: 'enum', enum: NivelEducativo })
    nivelEducativo: NivelEducativo;

    @Column({ type: 'enum', enum: TipoCalificacion })
    tipoCalificacion: TipoCalificacion;

    @Column({ type: 'enum', enum: EstadoMateria, default: EstadoMateria.ACTIVO })
    estado: EstadoMateria;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}