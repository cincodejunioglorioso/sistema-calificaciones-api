import { Test, TestingModule } from '@nestjs/testing';
import { CalificacionCualitativaController } from './calificacion-cualitativa.controller';
import { CalificacionCualitativaService } from './calificacion-cualitativa.service';

describe('CalificacionCualitativaController', () => {
  let controller: CalificacionCualitativaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalificacionCualitativaController],
      providers: [CalificacionCualitativaService],
    }).compile();

    controller = module.get<CalificacionCualitativaController>(CalificacionCualitativaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
