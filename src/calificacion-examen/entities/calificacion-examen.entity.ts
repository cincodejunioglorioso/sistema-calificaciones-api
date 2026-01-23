import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Estudiante } from "../../estudiantes/entities/estudiante.entity";
import { MateriaCurso } from "../../materia-curso/entities/materia-curso.entity";
import { Trimestre } from "../../trimestres/entities/trimestre.entity";
import { Docente } from "../../docentes/entities/docente.entity";

@Entity('calificacion_examen')
@Unique(['estudiante_id', 'materia_curso_id', 'trimestre_id'])
export class CalificacionExamen {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    estudiante_id: string;

    @Column({ type: 'uuid' })
    materia_curso_id: string;

    @Column({ type: 'uuid' })
    trimestre_id: string;

    @Column({ type: 'uuid' })
    docente_id: string;

    @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
    calificacion_original: number | null;

    @Column({ type: 'decimal', precision: 4, scale: 2 })
    calificacion_examen: number;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Estudiante, { eager: true })
    @JoinColumn({ name: 'estudiante_id' })
    estudiante: Estudiante;

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
