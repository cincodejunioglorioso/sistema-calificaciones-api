import { Test, TestingModule } from '@nestjs/testing';
import { CalificacionExamenController } from './calificacion-examen.controller';
import { CalificacionExamenService } from './calificacion-examen.service';

describe('CalificacionExamenController', () => {
  let controller: CalificacionExamenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalificacionExamenController],
      providers: [CalificacionExamenService],
    }).compile();

    controller = module.get<CalificacionExamenController>(CalificacionExamenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
