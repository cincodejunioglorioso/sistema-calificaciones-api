import { PeriodoLectivo } from "../../periodos-lectivos/entities/periodos-lectivo.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, Unique } from "typeorm";

export enum NombreTipoEvaluacion {
    INSUMOS = 'INSUMOS',
    PROYECTO = 'PROYECTO',
    EXAMEN = 'EXAMEN'
}

@Entity('tipos_evaluacion')
@Unique(['periodo_lectivo_id', 'nombre'])
export class TipoEvaluacion {
    
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'uuid'})
    periodo_lectivo_id: string;

    @Column({ type: 'enum', enum: NombreTipoEvaluacion })
    nombre: NombreTipoEvaluacion;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    porcentaje: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => PeriodoLectivo, (periodo) => periodo.tipos_evaluacion, { 
        eager: true,
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'periodo_lectivo_id' })
    periodo_lectivo: PeriodoLectivo;
}