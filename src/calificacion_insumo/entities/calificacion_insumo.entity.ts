import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Insumo } from "../../insumos/entities/insumo.entity";
import { Estudiante } from "../../estudiantes/entities/estudiante.entity";
import { Docente } from "../../docentes/entities/docente.entity";
import { RecuperacionInsumo } from "../../recuperacion_insumo/entities/recuperacion_insumo.entity";

@Entity('calificacion_insumo')
@Unique(['insumo_id', 'estudiante_id'])
export class CalificacionInsumo {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'uuid'})
    insumo_id: string;

    @Column({type: 'uuid'})
    estudiante_id: string;

    @Column({type: 'uuid'})
    docente_id: string;

    @Column({ type: 'decimal', precision: 4, scale: 2 })
    nota_original: number;

    @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
    nota_final: number;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Insumo, {eager: true})
    @JoinColumn({ name: 'insumo_id' })
    insumo: Insumo;

    @ManyToOne(() => Estudiante, {eager: true})
    @JoinColumn({ name: 'estudiante_id' })
    estudiante: Estudiante;

    @ManyToOne(() => Docente, {eager: true})
    @JoinColumn({ name: 'docente_id' })
    docente: Docente;

    @OneToMany(() => RecuperacionInsumo, recuperacion => recuperacion.calificacion_insumo, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    recuperaciones: RecuperacionInsumo[];
}
