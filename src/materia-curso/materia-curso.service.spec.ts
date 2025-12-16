import { Test, TestingModule } from '@nestjs/testing';
import { MateriaCursoService } from './materia-curso.service';

describe('MateriaCursoService', () => {
  let service: MateriaCursoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MateriaCursoService],
    }).compile();

    service = module.get<MateriaCursoService>(MateriaCursoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
