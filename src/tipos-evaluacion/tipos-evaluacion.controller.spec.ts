import { Test, TestingModule } from '@nestjs/testing';
import { TiposEvaluacionController } from './tipos-evaluacion.controller';
import { TiposEvaluacionService } from './tipos-evaluacion.service';

describe('TiposEvaluacionController', () => {
  let controller: TiposEvaluacionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TiposEvaluacionController],
      providers: [TiposEvaluacionService],
    }).compile();

    controller = module.get<TiposEvaluacionController>(TiposEvaluacionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
