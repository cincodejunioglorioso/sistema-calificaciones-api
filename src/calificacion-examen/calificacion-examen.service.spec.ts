import { Test, TestingModule } from '@nestjs/testing';
import { CalificacionExamenService } from './calificacion-examen.service';

describe('CalificacionExamenService', () => {
  let service: CalificacionExamenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalificacionExamenService],
    }).compile();

    service = module.get<CalificacionExamenService>(CalificacionExamenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
