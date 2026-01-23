import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { ConversionCualitativa } from "../../common/enums/cualitativa.enum";
import { Estudiante } from "../../estudiantes/entities/estudiante.entity";
import { MateriaCurso } from "../../materia-curso/entities/materia-curso.entity";
import { PeriodoLectivo } from "../../periodos-lectivos/entities/periodos-lectivo.entity";

export enum EstadoPromedioAnual {
    APROBADO = 'APROBADO',
    REPROBADO = 'REPROBADO',
    SUPLETORIO = 'SUPLETORIO'
}

@Entity('promedio_periodo')
@Unique(['estudiante_id', 'materia_curso_id', 'periodo_lectivo_id'])
export class PromedioPeriodo {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'uuid'})
    estudiante_id: string;

    @Column({type: 'uuid'})
    materia_curso_id: string;

    @Column({type: 'uuid'})
    periodo_lectivo_id: string;

    @Column({ type: 'decimal', precision: 4, scale: 2 })
    nota_trimestre_1: number;

    @Column({ type: 'decimal', precision: 4, scale: 2 })
    nota_trimestre_2: number;

    @Column({ type: 'decimal', precision: 4, scale: 2 })
    nota_trimestre_3: number;

    @Column({ type: 'decimal', precision: 4, scale: 2 })
    promedio_anual: number;

    @Column({ type: 'enum', enum: ConversionCualitativa })
    cualitativa_anual: ConversionCualitativa;  

    @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
    nota_supletorio: number | null;

    @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
    promedio_final: number | null;

    @Column({ type: 'enum', enum: ConversionCualitativa, nullable: true })
    cualitativa_final: ConversionCualitativa | null;
    
    @Column({ type: 'enum', enum: EstadoPromedioAnual })
    estado: EstadoPromedioAnual;

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

    @ManyToOne(() => PeriodoLectivo, { eager: true })
    @JoinColumn({ name: 'periodo_lectivo_id' })
    periodo_lectivo: PeriodoLectivo;  
}
