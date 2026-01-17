import { Test, TestingModule } from '@nestjs/testing';
import { CalificacionProyectoController } from './calificacion-proyecto.controller';
import { CalificacionProyectoService } from './calificacion-proyecto.service';

describe('CalificacionProyectoController', () => {
  let controller: CalificacionProyectoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalificacionProyectoController],
      providers: [CalificacionProyectoService],
    }).compile();

    controller = module.get<CalificacionProyectoController>(CalificacionProyectoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
