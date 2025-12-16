import { Curso } from "../../cursos/entities/curso.entity";
import { Estudiante } from "../../estudiantes/entities/estudiante.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { PeriodoLectivo } from "../../periodos-lectivos/entities/periodos-lectivo.entity";

export enum EstadoMatricula {
    ACTIVO = 'ACTIVO',
    FINALIZADO = 'FINALIZADO',
    RETIRADO = 'RETIRADO',
    ANULADO = 'ANULADO',
}

export enum OrigenMatricula {
    DISTRITO = 'DISTRITO',
    MANUAL = 'MANUAL',    
}

@Entity('matriculas')
export class Matricula {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    numero_de_matricula: string;

    @Column({type: 'uuid'})
    estudiante_id: string;

    @Column({type: 'uuid'})
    curso_id: string;

    @Column({type: 'uuid'})
    periodo_lectivo_id: string;

    @Column({ type: 'date', nullable: true })
    fecha_retiro?: Date;

    @Column({ type: 'enum', enum: OrigenMatricula, default: OrigenMatricula.DISTRITO })
    origen: OrigenMatricula;

    @Column({ nullable: true })
    archivo_origen?: string;
    
    @Column({ type: 'text', nullable: true })
    observaciones?: string;

    @Column({ type: 'enum', enum: EstadoMatricula, default: EstadoMatricula.ACTIVO })
    estado: EstadoMatricula;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
    
    @ManyToOne(() => Estudiante, { eager: true })
    @JoinColumn({ name: 'estudiante_id' })
    estudiante: Estudiante;

    @ManyToOne(() => Curso, { eager: true })
    @JoinColumn({ name: 'curso_id' })
    curso: Curso;

    @ManyToOne(() => PeriodoLectivo, { eager: true })
    @JoinColumn({ name: 'periodo_lectivo_id' })
    periodo_lectivo: PeriodoLectivo;
}
