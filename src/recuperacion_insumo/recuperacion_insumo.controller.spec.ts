import { Test, TestingModule } from '@nestjs/testing';
import { RecuperacionInsumoController } from './recuperacion_insumo.controller';
import { RecuperacionInsumoService } from './recuperacion_insumo.service';

describe('RecuperacionInsumoController', () => {
  let controller: RecuperacionInsumoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecuperacionInsumoController],
      providers: [RecuperacionInsumoService],
    }).compile();

    controller = module.get<RecuperacionInsumoController>(RecuperacionInsumoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
