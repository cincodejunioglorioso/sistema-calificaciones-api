import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
/* import { Curso } from '../../cursos/entities/curso.entity';
import { MateriaCurso } from '../../materias-curso/entities/materias-curso.entity';
import { CalificacionInsumo } from '../../calificaciones-insumo/entities/calificacion-insumo.entity';
 */

export enum nivelAsignado {
    BASICA = 'BASICA',
    BACHILLERATO = 'BACHILLERATO'
}

@Entity('docentes')
export class Docente {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    nombres: string;

    @Column()
    apellidos: string;

    @Column({ nullable: true, unique: true })
    cedula: string;

    @Column({ nullable: true })
    telefono: string;

    @Column({type: 'enum', enum: nivelAsignado })
    nivelAsignado: nivelAsignado;

    @Column({ nullable: true })
    foto_perfil_url: string;

    @Column({ nullable: true })
    foto_titulo_url: string;

    @Column({ default: false })
    perfil_completo: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToOne(() => Usuario, usuario => usuario.docente)
    @JoinColumn()
    usuario_id: Usuario;
}