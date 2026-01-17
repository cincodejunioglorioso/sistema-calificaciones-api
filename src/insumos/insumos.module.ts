import { Module } from '@nestjs/common';
import { InsumosService } from './insumos.service';
import { InsumosController } from './insumos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Insumo } from './entities/insumo.entity';
import { CalificacionInsumo } from '../calificacion_insumo/entities/calificacion_insumo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Insumo,
    CalificacionInsumo
  ])],
  controllers: [InsumosController],
  providers: [InsumosService],
  exports: [InsumosService]
})
export class InsumosModule {}
