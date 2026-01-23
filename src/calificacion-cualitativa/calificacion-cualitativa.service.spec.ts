import { Test, TestingModule } from '@nestjs/testing';
import { CalificacionCualitativaService } from './calificacion-cualitativa.service';

describe('CalificacionCualitativaService', () => {
  let service: CalificacionCualitativaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalificacionCualitativaService],
    }).compile();

    service = module.get<CalificacionCualitativaService>(CalificacionCualitativaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
