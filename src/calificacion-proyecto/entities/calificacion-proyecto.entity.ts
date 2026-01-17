import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Estudiante } from "../../estudiantes/entities/estudiante.entity";
import { Trimestre } from "../../trimestres/entities/trimestre.entity";
import { Curso } from "../../cursos/entities/curso.entity";
import { Docente } from "../../docentes/entities/docente.entity";

@Entity('calificacion_proyecto')
@Unique(['estudiante_id', 'curso_id', 'trimestre_id'])
export class CalificacionProyecto {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'uuid'})
    estudiante_id: string;

    @Column({type: 'uuid'})
    curso_id: string;

    @Column({type: 'uuid'})
    trimestre_id: string;

    @Column({type: 'uuid'})
    docente_id: string;

    @Column({type: 'decimal', precision: 4, scale: 2})
    calificacion_proyecto: number;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Estudiante, {eager: true})
    @JoinColumn({ name: 'estudiante_id' })
    estudiante: Estudiante;

    @ManyToOne(() => Trimestre, {eager: true})
    @JoinColumn({ name: 'trimestre_id' })
    trimestre: Trimestre;
    
    @ManyToOne(() => Curso, {eager: true})
    @JoinColumn({ name: 'curso_id' })
    curso: Curso;

    @ManyToOne(() => Docente, {eager: true})
    @JoinColumn({ name: 'docente_id' })
    docente: Docente;    
}
