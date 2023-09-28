import { ApiProperty } from '@nestjs/swagger';
import { getModelForClass, prop } from '@typegoose/typegoose';

export class Post {
  @prop()
  @ApiProperty({ description: '标题' })
  title: string;

  @prop()
  @ApiProperty({ description: '标签' })
  notes: string[];

  @prop()
  @ApiProperty({ description: '诗句' })
  paragraphs: string[];

  @prop()
  @ApiProperty({ description: '朝代' })
  dynasty: string;

  @prop()
  @ApiProperty({ description: '作者' })
  author: string;
}

// 定义 mongodb 数据模型
export const PostModel = getModelForClass(Post);
