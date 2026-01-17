import { Test, TestingModule } from '@nestjs/testing';
import { PromedioPeriodoController } from './promedio-periodo.controller';
import { PromedioPeriodoService } from './promedio-periodo.service';

describe('PromedioPeriodoController', () => {
  let controller: PromedioPeriodoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromedioPeriodoController],
      providers: [PromedioPeriodoService],
    }).compile();

    controller = module.get<PromedioPeriodoController>(PromedioPeriodoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
