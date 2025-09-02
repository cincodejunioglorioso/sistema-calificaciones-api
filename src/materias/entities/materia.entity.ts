import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


export enum NivelEducativo {
  BASICA = 'BASICA',
  BACHILLERATO = 'BACHILLERATO',
  AMBOS = 'AMBOS'
}

export enum TrimestreAplicable {
    TODOS = 'TODOS',
    PRIMERO = 'PRIMERO',
    SEGUNDO = 'SEGUNDO',
    TERCERO = 'TERCERO',
}

export enum EstadoMateria {
    ACTIVA = 'ACTIVA',
    INACTIVA = 'INACTIVA',
}

@Entity('materias')
export class Materia {

    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    nombre: string;

    @Column({ type: 'enum', enum: NivelEducativo })
    nivelEducativo: NivelEducativo;

    @Column({ type: 'enum', enum: TrimestreAplicable })
    trimestreAplicable: TrimestreAplicable;

    @Column({ type: 'enum', enum: EstadoMateria, default: EstadoMateria.ACTIVA })
    estado: EstadoMateria;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}