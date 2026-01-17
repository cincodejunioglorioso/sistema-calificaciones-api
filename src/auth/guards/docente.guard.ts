import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role} from '../../usuarios/entities/usuario.entity';

@Injectable()
export class DocenteGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const usuario = request.user;

    if (!usuario) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    if (usuario.rol !== Role.DOCENTE) {
      throw new ForbiddenException('Solo los docentes pueden acceder a este recurso');
    }

    if (!usuario.docente_id) {
      throw new ForbiddenException('Usuario sin perfil de docente completo');
    }

    return true;
  }
}