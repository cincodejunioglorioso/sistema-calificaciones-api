import { Docente } from '../../docentes/entities/docente.entity';
import { Column, CreateDateColumn, Entity, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum Role {
    ADMIN = 'ADMIN',
    DOCENTE = 'DOCENTE',
    SECRETARIA = 'SECRETARIA'
}

export enum Estado {
    ACTIVO = 'ACTIVO',
    INACTIVO = 'INACTIVO',
    PENDIENTE = 'PENDIENTE'
}

@Entity('usuarios') 
export class Usuario {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password_hash: string;

    @Column({ type: 'enum', enum: Role, default: Role.DOCENTE })
    rol: Role;

    @Column({ type: 'enum', enum: Estado, default: Estado.ACTIVO })
    estado: Estado;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne( () => Docente, docente => docente.usuario_id,)
    docente?: Docente;
}