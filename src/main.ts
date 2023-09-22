import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as mongoose from 'mongoose';

async function bootstrap() {
  mongoose.connect('mongodb://localhost/nest-blog-api');

  const app = await NestFactory.create(AppModule);

  const options = new DocumentBuilder()
    .setTitle("Xzxldl's NestJS blog api")
    .setDescription('Just api description')
    .setVersion('1.0')
    .addTag('blog')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  await app.listen(4766);
}
bootstrap();
