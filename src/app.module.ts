import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { UserModule } from './user/user.module';

// @Module装饰器，标注下面的AppModule是一个模块
@Module({
  imports: [PostsModule, UserModule], // 注册其他导入模块
  controllers: [AppController], // 注册控制器
  providers: [AppService], // 依赖注入相关
})
export class AppModule {}
