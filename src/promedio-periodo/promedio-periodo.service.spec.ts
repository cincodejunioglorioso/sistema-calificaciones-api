import { Test, TestingModule } from '@nestjs/testing';
import { PromedioPeriodoService } from './promedio-periodo.service';

describe('PromedioPeriodoService', () => {
  let service: PromedioPeriodoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromedioPeriodoService],
    }).compile();

    service = module.get<PromedioPeriodoService>(PromedioPeriodoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
