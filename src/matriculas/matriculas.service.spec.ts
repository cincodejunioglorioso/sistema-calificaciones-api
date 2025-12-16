import { Test, TestingModule } from '@nestjs/testing';
import { MatriculasService } from './matriculas.service';

describe('MatriculasService', () => {
  let service: MatriculasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MatriculasService],
    }).compile();

    service = module.get<MatriculasService>(MatriculasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
