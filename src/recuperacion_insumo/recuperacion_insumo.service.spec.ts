import { Test, TestingModule } from '@nestjs/testing';
import { RecuperacionInsumoService } from './recuperacion_insumo.service';

describe('RecuperacionInsumoService', () => {
  let service: RecuperacionInsumoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecuperacionInsumoService],
    }).compile();

    service = module.get<RecuperacionInsumoService>(RecuperacionInsumoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
