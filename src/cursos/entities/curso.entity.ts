import { Docente } from "../../docentes/entities/docente.entity";
import { PeriodoLectivo } from "../../periodos-lectivos/entities/periodos-lectivo.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum EstadoCurso {
    ACTIVO = 'ACTIVO',
    INACTIVO = 'INACTIVO'
}

export enum EspecialidadCurso {
    BASICA = 'BASICA',
    TECNICO = 'TECNICO', 
    CIENCIAS = 'CIENCIAS'
}

export enum NivelCurso {
    OCTAVO = 'OCTAVO',
    NOVENO = 'NOVENO',
    DECIMO = 'DECIMO',
    PRIMERO_BACHILLERATO = 'PRIMERO BACHILLERATO',
    SEGUNDO_BACHILLERATO = 'SEGUNDO BACHILLERATO',
    TERCERO_BACHILLERATO = 'TERCERO BACHILLERATO'
}

export const NIVEL_URL_MAP = {
    'octavo': NivelCurso.OCTAVO,
    'noveno': NivelCurso.NOVENO,
    'decimo': NivelCurso.DECIMO,
    'primero-bachillerato': NivelCurso.PRIMERO_BACHILLERATO,
    'segundo-bachillerato': NivelCurso.SEGUNDO_BACHILLERATO,
    'tercero-bachillerato': NivelCurso.TERCERO_BACHILLERATO
}

export function getNivelFromUrl(urlParam: string): NivelCurso | null {
    return NIVEL_URL_MAP[urlParam.toLowerCase()] || null;
}

@Entity('cursos')
export class Curso {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: NivelCurso})
    nivel: NivelCurso;

    @Column()
    paralelo: string;

    @Column({ type: 'enum', enum: EspecialidadCurso })
    especialidad: EspecialidadCurso;

    @Column({ type: 'enum', enum: EstadoCurso, default: EstadoCurso.ACTIVO })
    estado: EstadoCurso;

    @Column({type: 'uuid'})
    periodo_lectivo_id: string;
    
    @ManyToOne(() => PeriodoLectivo, { eager: true })
    @JoinColumn({ name: 'periodo_lectivo_id' })
    periodo_lectivo: PeriodoLectivo;

    @Column({nullable: true, type: 'uuid'})
    docente_id: string;

    @ManyToOne(() => Docente, { nullable: true })
    @JoinColumn({ name: 'docente_id' })
    docente: Docente;

    @Column({ type: 'int', default: 0 })
    estudiantes_matriculados: number;
    
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
