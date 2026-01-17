import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CursosService } from "../../cursos/cursos.service";
import { Matricula } from "../../matriculas/entities/matricula.entity";
import { EstadoMatricula } from "../../matriculas/entities/matricula.entity";

@Injectable()
export class TutorGuard implements CanActivate {
  constructor(
    private readonly cursosService: CursosService,
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user.docente_id) {
      throw new ForbiddenException('El usuario no es un docente');
    }

    // Validación por curso_id (para proyectos, calificaciones, etc.)
    const curso_id = request.body?.curso_id || request.params?.curso_id || request.query?.curso_id;
    
    if (curso_id) {
      const curso = await this.cursosService.findOne(curso_id);

      if (!curso) {
        throw new ForbiddenException('Curso no encontrado');
      }

      if (curso.docente_id !== user.docente_id) {
        throw new ForbiddenException('Solo el tutor del curso puede realizar esta acción');
      }

      return true;
    }

    // Validación por estudiante_id (para editar datos personales)
    const estudiante_id = request.params?.id;

    if (estudiante_id) {
      // Buscar matrícula ACTIVA del estudiante
      const matricula = await this.matriculaRepository.findOne({
        where: {
          estudiante_id,
          estado: EstadoMatricula.ACTIVO,
        },
        relations: ['curso'],
      });

      if (!matricula) {
        throw new ForbiddenException('Estudiante sin matrícula activa');
      }

      // Validar que el docente es tutor del curso actual
      if (matricula.curso.docente_id !== user.docente_id) {
        throw new ForbiddenException('Solo el tutor actual del estudiante puede editar sus datos');
      }

      return true;
    }

    // Si no hay curso_id ni estudiante_id
    throw new ForbiddenException('Se requiere curso_id o estudiante_id para validar permisos de tutor');
  }
}