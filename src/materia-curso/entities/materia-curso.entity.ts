import { Curso } from "../../cursos/entities/curso.entity";
import { Docente } from "../../docentes/entities/docente.entity";
import { Materia } from "../../materias/entities/materia.entity";
import { PeriodoLectivo } from "../../periodos-lectivos/entities/periodos-lectivo.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


export enum EstadoMateriaCurso {
    ACTIVO = 'ACTIVO',
    INACTIVO = 'INACTIVO',
}

@Entity('materias_curso')
export class MateriaCurso {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'uuid'})
    materia_id: string; 

    @ManyToOne(() => Materia, { eager: true })
    @JoinColumn({ name: 'materia_id' })
    materia: Materia;

    @Column({type: 'uuid'})
    curso_id: string;

    @ManyToOne(() => Curso, { eager: true })
    @JoinColumn({ name: 'curso_id' })
    curso: Curso;

    @Column({ nullable: true, type: 'uuid' })
    docente_id?: string

    @ManyToOne( () => Docente, { nullable: true, eager: true } )
    @JoinColumn({ name: 'docente_id' })
    docente?: Docente;

    @Column({type: 'uuid'})
    periodo_lectivo_id: string;

    @ManyToOne(() => PeriodoLectivo, { eager: true })
    @JoinColumn({ name: 'periodo_lectivo_id' })
    periodo_lectivo: PeriodoLectivo;

    @Column({ type: 'enum', enum: EstadoMateriaCurso, default: EstadoMateriaCurso.ACTIVO })
    estado: EstadoMateriaCurso;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
