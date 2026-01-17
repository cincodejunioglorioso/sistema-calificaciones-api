import { Test, TestingModule } from '@nestjs/testing';
import { TiposEvaluacionService } from './tipos-evaluacion.service';

describe('TiposEvaluacionService', () => {
  let service: TiposEvaluacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TiposEvaluacionService],
    }).compile();

    service = module.get<TiposEvaluacionService>(TiposEvaluacionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
