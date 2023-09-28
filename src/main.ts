import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as mongoose from 'mongoose';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  mongoose.connect('mongodb://127.0.0.1:27017/nest-blog-api');

  // 指定底层使用 Express
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const options = new DocumentBuilder()
    .setTitle("Xzxldl's NestJS blog api")
    .setDescription('Just api description')
    .setVersion('1.0')
    .addTag('blog')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  // 设置文档路径为 docs
  SwaggerModule.setup('docs', app, document);

  // 设置静态文件目录支持 --> /public 目录下文件可以使用 /static 路由来进行访问
  app.useStaticAssets('public', { prefix: '/static' });

  await app.listen(4766);
}
bootstrap();
