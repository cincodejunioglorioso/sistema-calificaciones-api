import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Estudiante } from "../../estudiantes/entities/estudiante.entity";
import { MateriaCurso } from "../../materia-curso/entities/materia-curso.entity";
import { Trimestre } from "../../trimestres/entities/trimestre.entity";
import { CalificacionCualitativa } from "../../common/enums/cualitativa.enum";

@Entity('promedio_trimestre')
@Unique(['estudiante_id', 'materia_curso_id', 'trimestre_id'])
export class PromedioTrimestre {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'uuid'})
    estudiante_id: string;

    @Column({type: 'uuid'})
    materia_curso_id: string;

    @Column({type: 'uuid'})
    trimestre_id: string;

    @Column({type: 'decimal', precision: 4, scale: 2, nullable: true})
    promedio_insumos: number;

    @Column({type: 'decimal', precision: 4, scale: 2, nullable: true})
    ponderado_insumos: number;

    @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
    nota_proyecto: number;

    @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
    ponderado_proyecto: number;

    @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
    nota_examen: number;

    @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
    ponderado_examen: number;

    @Column({ type: 'decimal', precision: 4, scale: 2 })
    nota_final_trimestre: number;

    @Column({ type: 'enum', enum: CalificacionCualitativa })
    cualitativa: CalificacionCualitativa;

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
}
