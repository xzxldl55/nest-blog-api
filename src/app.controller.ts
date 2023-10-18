import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags } from '@nestjs/swagger';
import { AaaFilter } from './filters/aaa.filter';
import { AaaExcepiton } from './filters/aaa.exception';
import { Myd } from './decorator/myd.decorator';

// 定义一个装饰器（控制器）
@Controller()
@ApiTags('默认')
export class AppController {
  // 实例化时，将AppService依赖注入进来
  constructor(private readonly appService: AppService) {}

  // 定义一个GET请求
  @Myd(new AaaFilter())
  getHello(): string {
    throw new AaaExcepiton('1', '2');
  }
}
