import { Test, TestingModule } from '@nestjs/testing';
import { PromedioTrimestreController } from './promedio-trimestre.controller';
import { PromedioTrimestreService } from './promedio-trimestre.service';

describe('PromedioTrimestreController', () => {
  let controller: PromedioTrimestreController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromedioTrimestreController],
      providers: [PromedioTrimestreService],
    }).compile();

    controller = module.get<PromedioTrimestreController>(PromedioTrimestreController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
