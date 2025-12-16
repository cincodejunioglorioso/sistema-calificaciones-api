import { PeriodoLectivo } from '../../periodos-lectivos/entities/periodos-lectivo.entity';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum TrimestreEstado {
    ACTIVO = 'ACTIVO',
    FINALIZADO = 'FINALIZADO',
    PENDIENTE = 'PENDIENTE'
}

export enum NombreTrimestre {
    PRIMER_TRIMESTRE = 'PRIMER TRIMESTRE',
    SEGUNDO_TRIMESTRE = 'SEGUNDO TRIMESTRE',
    TERCER_TRIMESTRE = 'TERCER TRIMESTRE'
}

@Entity('trimestres')
export class Trimestre {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: NombreTrimestre })
    nombre: NombreTrimestre;

    @Column({ type: 'date' })
    fechaInicio: Date;

    @Column({ type: 'date' })
    fechaFin: Date;

    @Column({ type: 'enum', enum: TrimestreEstado, default: TrimestreEstado.PENDIENTE })
    estado: TrimestreEstado;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column()
    periodo_lectivo_id: string;

    @ManyToOne(() => PeriodoLectivo, { eager: true})
    @JoinColumn({ name: 'periodo_lectivo_id' })
    periodo_lectivo: PeriodoLectivo;
}
