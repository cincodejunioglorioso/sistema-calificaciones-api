import { Module } from '@nestjs/common';
import { RecuperacionExamenService } from './recuperacion-examen.service';
import { RecuperacionExamenController } from './recuperacion-examen.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecuperacionExamen } from './entities/recuperacion-examen.entity';
import { CalificacionExamen } from '../calificacion-examen/entities/calificacion-examen.entity';

@Module({
  imports: [TypeOrmModule.forFeature(
    [
      RecuperacionExamen,
      CalificacionExamen,
    ]
  )],
  controllers: [RecuperacionExamenController],
  providers: [RecuperacionExamenService],
  exports: [RecuperacionExamenService],
})
export class RecuperacionExamenModule { }
