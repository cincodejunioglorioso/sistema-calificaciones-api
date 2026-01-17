import { Test, TestingModule } from '@nestjs/testing';
import { CalificacionInsumoController } from './calificacion_insumo.controller';
import { CalificacionInsumoService } from './calificacion_insumo.service';

describe('CalificacionInsumoController', () => {
  let controller: CalificacionInsumoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalificacionInsumoController],
      providers: [CalificacionInsumoService],
    }).compile();

    controller = module.get<CalificacionInsumoController>(CalificacionInsumoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
