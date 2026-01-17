import { Module } from '@nestjs/common';
import { TiposEvaluacionService } from './tipos-evaluacion.service';
import { TiposEvaluacionController } from './tipos-evaluacion.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoEvaluacion } from './entities/tipos-evaluacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TipoEvaluacion])],
  controllers: [TiposEvaluacionController],
  providers: [TiposEvaluacionService],
  exports: [TiposEvaluacionService]
})
export class TiposEvaluacionModule {}
