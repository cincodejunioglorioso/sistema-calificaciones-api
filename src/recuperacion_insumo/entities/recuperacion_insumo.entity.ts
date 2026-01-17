import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { CalificacionInsumo } from "../../calificacion_insumo/entities/calificacion_insumo.entity";

@Entity('recuperacion_insumo')
export class RecuperacionInsumo {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid'} )
    calificacion_insumo_id: string;

    @Column({ type: 'decimal', precision: 4, scale: 2 })
    nota_recuperacion: number;

    @Column({ type: 'int' })
    intento: number;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => CalificacionInsumo, { eager: true })
    @JoinColumn({ name: 'calificacion_insumo_id' })
    calificacion_insumo: CalificacionInsumo;
}
