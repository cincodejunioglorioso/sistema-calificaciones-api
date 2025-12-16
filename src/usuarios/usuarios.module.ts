import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { Docente } from '../docentes/entities/docente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Docente])],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports:[UsuariosService]
})
export class UsuariosModule {}
