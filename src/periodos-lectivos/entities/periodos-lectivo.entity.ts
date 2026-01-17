import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Trimestre } from "../../trimestres/entities/trimestre.entity";
import { TipoEvaluacion } from "../../tipos-evaluacion/entities/tipos-evaluacion.entity";

export enum EstadoPeriodo {
    ACTIVO = 'ACTIVO',
    FINALIZADO = 'FINALIZADO'
}

@Entity('periodos_lectivos')
export class PeriodoLectivo {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    nombre: string;

    @Column({type: 'date'})
    fechaInicio: Date;

    @Column({type: 'date'})
    fechaFin: Date;   

    @Column({ type: 'enum', enum: EstadoPeriodo, default: EstadoPeriodo.ACTIVO })
    estado: EstadoPeriodo;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Trimestre, (trimestre) => trimestre.periodo_lectivo, {
        cascade: true,
        onDelete: 'CASCADE'
    })
    trimestres: Trimestre[];

    @OneToMany(() => TipoEvaluacion, (tipoEvaluacion) => tipoEvaluacion.periodo_lectivo, {
        cascade: true,
        onDelete: 'CASCADE'
    })
    tipos_evaluacion: TipoEvaluacion[];
}
