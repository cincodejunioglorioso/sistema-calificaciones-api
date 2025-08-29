import { Docente } from '../../docentes/entities/docente.entity';
import { Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum Role {
    ADMIN = 'ADMIN',
    DOCENTE = 'DOCENTE',
    AUTORIDAD = 'AUTORIDAD'
}

export enum Status {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    PENDING = 'PENDING'
}

@Entity('usuarios') 
export class Usuario {
    @PrimaryGeneratedColumn()
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password_hash: string;

    @Column({ type: 'enum', enum: Role, default: Role.DOCENTE })
    rol: Role;

    @Column({ type: 'enum', enum: Status, default: Status.ACTIVE })
    estado: Status;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne( () => Docente, docente => docente.usuario_id,)
    docente?: Docente;
}