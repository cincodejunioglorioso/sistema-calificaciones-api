import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { CalificacionExamen } from "../../calificacion-examen/entities/calificacion-examen.entity";

@Entity('recuperacion_examen')
export class RecuperacionExamen {
    
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    calificacion_examen_id: string;

    @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
    segundo_examen: number | null;

    @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
    trabajo_refuerzo: number | null;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => CalificacionExamen, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'calificacion_examen_id' })
    calificacion_examen: CalificacionExamen;
}