import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export enum NivelAsignado {
    BASICA = 'BASICA',
    BACHILLERATO = 'BACHILLERATO',
    GLOBAL = 'GLOBAL'
}

@Entity('docentes')
export class Docente {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    nombres: string;

    @Column()
    apellidos: string;

    @Column({ nullable: true, unique: true })
    cedula: string;

    @Column({ nullable: true })
    telefono: string;

    @Column({type: 'enum', enum: NivelAsignado })
    nivelAsignado: NivelAsignado;

    @Column({ nullable: true })
    foto_perfil_url: string;

    @Column({ nullable: true })
    foto_titulo_url: string;

/*     @Column({ nullable: true })
    expertise: string; */

    @Column({ default: false })
    perfil_completo: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(() => Usuario, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'usuario_id' })
    usuario_id: Usuario;
}