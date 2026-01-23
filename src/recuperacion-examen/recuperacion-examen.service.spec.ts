import { Test, TestingModule } from '@nestjs/testing';
import { RecuperacionExamenService } from './recuperacion-examen.service';

describe('RecuperacionExamenService', () => {
  let service: RecuperacionExamenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecuperacionExamenService],
    }).compile();

    service = module.get<RecuperacionExamenService>(RecuperacionExamenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
