import { Module } from '@nestjs/common';
import { CalificacionInsumoService } from './calificacion_insumo.service';
import { CalificacionInsumoController } from './calificacion_insumo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalificacionInsumo } from './entities/calificacion_insumo.entity';
import { Matricula } from '../matriculas/entities/matricula.entity';
import { InsumosModule } from '../insumos/insumos.module';
import { RecuperacionInsumo } from '../recuperacion_insumo/entities/recuperacion_insumo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CalificacionInsumo, Matricula, RecuperacionInsumo]),
  InsumosModule
  ],
  controllers: [CalificacionInsumoController],
  providers: [CalificacionInsumoService],
  exports: [CalificacionInsumoService]
})
export class CalificacionInsumoModule {}