import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Estudiante } from '../../estudiantes/entities/estudiante.entity';
import { Curso } from '../../cursos/entities/curso.entity';
import { Trimestre } from '../../trimestres/entities/trimestre.entity';
import { Materia } from '../../materias/entities/materia.entity';
import { CalificacionComponente } from '../../common/enums/cualitativa.enum';

@Entity('calificacion_componente_cualitativo')
@Unique(['estudiante_id', 'curso_id', 'materia_id', 'trimestre_id'])
export class CalificacionComponenteCualitativo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  estudiante_id: string;

  @Column({ type: 'uuid' })
  curso_id: string;

  @Column({ type: 'uuid' })
  materia_id: string;

  @Column({ type: 'uuid' })
  trimestre_id: string;

  @Column({
    type: 'enum',
    enum: CalificacionComponente,
    nullable: true,
    default: null,
  })
  calificacion: CalificacionComponente | null;

  @ManyToOne(() => Estudiante, { eager: true })
  @JoinColumn({ name: 'estudiante_id' })
  estudiante: Estudiante;

  @ManyToOne(() => Curso, { eager: true })
  @JoinColumn({ name: 'curso_id' })
  curso: Curso;

  @ManyToOne(() => Materia, { eager: true })
  @JoinColumn({ name: 'materia_id' })
  materia: Materia;

  @ManyToOne(() => Trimestre, { eager: true })
  @JoinColumn({ name: 'trimestre_id' })
  trimestre: Trimestre;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}