import { Test, TestingModule } from '@nestjs/testing';
import { PromedioTrimestreService } from './promedio-trimestre.service';

describe('PromedioTrimestreService', () => {
  let service: PromedioTrimestreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromedioTrimestreService],
    }).compile();

    service = module.get<PromedioTrimestreService>(PromedioTrimestreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
