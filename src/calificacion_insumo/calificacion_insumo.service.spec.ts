import { Test, TestingModule } from '@nestjs/testing';
import { CalificacionInsumoService } from './calificacion_insumo.service';

describe('CalificacionInsumoService', () => {
  let service: CalificacionInsumoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalificacionInsumoService],
    }).compile();

    service = module.get<CalificacionInsumoService>(CalificacionInsumoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
