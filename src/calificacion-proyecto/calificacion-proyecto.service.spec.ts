import { Test, TestingModule } from '@nestjs/testing';
import { CalificacionProyectoService } from './calificacion-proyecto.service';

describe('CalificacionProyectoService', () => {
  let service: CalificacionProyectoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalificacionProyectoService],
    }).compile();

    service = module.get<CalificacionProyectoService>(CalificacionProyectoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
