import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Matricula } from "../../matriculas/entities/matricula.entity";

export enum EstadoEstudiante {
    ACTIVO = 'ACTIVO',
    SIN_MATRICULA = 'SIN_MATRICULA',
    GRADUADO = 'GRADUADO',
    RETIRADO = 'RETIRADO',
    INACTIVO_TEMPORAL = 'INACTIVO_TEMPORAL'
}

@Entity('estudiantes')
export class Estudiante {
    
    @PrimaryGeneratedColumn('uuid')
    id: string;

    //Datos del estudiante
    @Column()
    nombres_completos: string;

    @Column({ unique: true })
    estudiante_cedula: string;

    @Column({ unique: true, nullable: true })
    estudiante_email?: string;

    @Column({ type: 'date', nullable: true })
    fecha_de_nacimiento?: Date;

    @Column({ nullable: true })
    direccion?: string;

    //Datos de los padres
    @Column({nullable: true})
    padre_nombre?: string;

    @Column({nullable: true})
    padre_apellido?: string;

    @Column({nullable: true})
    padre_cedula?: string;

    @Column({nullable: true})
    madre_nombre?: string;

    @Column({nullable: true})
    madre_apellido?: string;

    @Column({nullable: true})
    madre_cedula?: string;

    @Column({ type: 'boolean', default: false })
    viven_juntos: boolean;

    //Datos del representante
    @Column({ nullable: true })
    representante_nombre?: string;

    @Column({ nullable: true })
    representante_apellido?: string;

    @Column({ nullable: true })
    representante_telefono?: string;

    @Column({ nullable: true })
    representante_telefono_auxiliar?: string;
    
    @Column({ nullable: true })
    representante_correo?: string;
    
    @Column({ nullable: true })
    representante_parentesco?: string;

    @Column({ type: 'boolean', default: false })
    datos_completos?: boolean;

    @Column({ type: 'enum', enum: EstadoEstudiante, default: EstadoEstudiante.ACTIVO })
    estado: EstadoEstudiante;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany( ()=> Matricula, (matricula) => matricula.estudiante )
    matriculas?: Matricula[];


    //Validacion para datos obligatorios completos
    validarDatosCompletos(): boolean {
        const camposObligatorios = [
            this.fecha_de_nacimiento,
            this.direccion,
            this.representante_nombre,
            this.representante_apellido,
            this.representante_telefono,
            this.representante_parentesco
        ];

        return camposObligatorios.every(campo => 
            campo !== null && 
            campo !== undefined && 
            campo !== ''
        );
    }

    @BeforeInsert()
    @BeforeUpdate()
    actualizarEstadoCompletitud() {
        this.datos_completos = this.validarDatosCompletos();
    }

}


/*
Roles:
    Secretaria
        - matricula estudiantes

    DECE:
        - CONSULTAR INFORMACION - Calificaciones

    AUTORIDADES
        - 


quien se encarga de desactivar o dar de baja a un estudiante?
    - TIC


bachillerato > tecnico y ciencias

cambios de paralelos


 */
