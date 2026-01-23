import { Test, TestingModule } from '@nestjs/testing';
import { RecuperacionExamenController } from './recuperacion-examen.controller';
import { RecuperacionExamenService } from './recuperacion-examen.service';

describe('RecuperacionExamenController', () => {
  let controller: RecuperacionExamenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecuperacionExamenController],
      providers: [RecuperacionExamenService],
    }).compile();

    controller = module.get<RecuperacionExamenController>(RecuperacionExamenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
