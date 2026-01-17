import { Module } from '@nestjs/common';
import { RecuperacionInsumoService } from './recuperacion_insumo.service';
import { RecuperacionInsumoController } from './recuperacion_insumo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecuperacionInsumo } from './entities/recuperacion_insumo.entity';
import { CalificacionInsumo } from '../calificacion_insumo/entities/calificacion_insumo.entity';
import { CalificacionInsumoModule } from '../calificacion_insumo/calificacion_insumo.module';

@Module({
  imports: [TypeOrmModule.forFeature([RecuperacionInsumo, CalificacionInsumo]),
    CalificacionInsumoModule
  ],
  controllers: [RecuperacionInsumoController],
  providers: [RecuperacionInsumoService],
  exports: [RecuperacionInsumoService]
})
export class RecuperacionInsumoModule {}
