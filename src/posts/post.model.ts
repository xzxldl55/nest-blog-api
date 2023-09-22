import { getModelForClass, prop } from '@typegoose/typegoose';

export class Post {
  @prop()
  title: string;

  @prop()
  content: string;
}

// 定义 mongodb 数据模型
export const PostModel = getModelForClass(Post);
