import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { MateriaCurso } from "../../materia-curso/entities/materia-curso.entity";
import { Trimestre } from "../../trimestres/entities/trimestre.entity";
import { Docente } from "../../docentes/entities/docente.entity";

export enum EstadoInsumo {
    ACTIVO = 'ACTIVO',
    BORRADOR = 'BORRADOR',
    PUBLICADO = 'PUBLICADO',
    CERRADO = 'CERRADO'
}

@Entity('insumos')
export class Insumo {
    
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'uuid'})
    materia_curso_id: string;

    @Column({type: 'uuid'})
    trimestre_id: string;

    @Column({type: 'uuid'})
    docente_id: string;

    @Column()
    nombre: string;

    @Column({ type: 'enum', enum: EstadoInsumo, default: EstadoInsumo.BORRADOR })
    estado: EstadoInsumo;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => MateriaCurso, { eager: true })
    @JoinColumn({ name: 'materia_curso_id' })
    materia_curso: MateriaCurso;

    @ManyToOne(() => Trimestre, { eager: true })
    @JoinColumn({ name: 'trimestre_id' })
    trimestre: Trimestre;

    @ManyToOne(() => Docente, { eager: true })
    @JoinColumn({ name: 'docente_id' })
    docente: Docente;
}
