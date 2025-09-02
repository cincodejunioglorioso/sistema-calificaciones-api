import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum EstadoPeriodo {
    ACTIVO = 'ACTIVO',
    FINALIZADO = 'FINALIZADO'
}

@Entity('periodos_lectivos')
export class PeriodoLectivo {

    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    nombre: string;

    @Column({type: 'date'})
    fechaInicio: Date;

    @Column({type: 'date'})
    fechaFin: Date;   

    @Column({
        type: 'enum',
        enum: EstadoPeriodo,
        default: EstadoPeriodo.ACTIVO
    })
    estado: EstadoPeriodo;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
