import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";


@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isAuthenticated = await super.canActivate(context);

        if (!isAuthenticated) {
            return false;
        }
        
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (user.rol !== 'ADMIN') {
            throw new ForbiddenException('Acceso denegado: se requiere rol de ADMIN');
        }

        return true;
    }
}