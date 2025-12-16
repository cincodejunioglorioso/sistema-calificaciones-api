import { Test, TestingModule } from '@nestjs/testing';
import { MatriculasController } from './matriculas.controller';
import { MatriculasService } from './matriculas.service';

describe('MatriculasController', () => {
  let controller: MatriculasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatriculasController],
      providers: [MatriculasService],
    }).compile();

    controller = module.get<MatriculasController>(MatriculasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
