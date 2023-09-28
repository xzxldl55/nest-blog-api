import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags } from '@nestjs/swagger';

// 定义一个装饰器（控制器）
@Controller()
@ApiTags('默认')
export class AppController {
  // 实例化时，将AppService依赖注入进来
  constructor(private readonly appService: AppService) {}

  // 定义一个GET请求
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
