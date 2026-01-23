import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '../../usuarios/entities/usuario.entity';

@Injectable()
export class DocenteOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const usuario = request.user;

    if (!usuario) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // ✅ Permitir si es ADMIN (sin necesidad de docente_id)
    if (usuario.rol === Role.ADMIN) {
      return true;
    }

    // ✅ Permitir si es DOCENTE con docente_id válido
    if (usuario.rol === Role.DOCENTE) {
      if (!usuario.docente_id) {
        throw new ForbiddenException('Usuario docente sin perfil completo');
      }
      return true;
    }

    // ❌ Cualquier otro rol
    throw new ForbiddenException('Acceso denegado: se requiere rol de ADMIN o DOCENTE');
  }
}