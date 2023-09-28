import { Injectable } from '@nestjs/common';
import { Post, PostModel } from './post.model';

@Injectable()
export class PostsService {
  async returnTestPost(title: string) {
    const result = await PostModel.findOne({ title }).exec();
    return result;
  }

  async deletePost(title: string) {
    const result = await PostModel.findOneAndRemove({ title });
    console.log(result);
    return !!result;
  }

  async createPost(data: Post, userid: string) {
    const result = await PostModel.insertMany([data]);

    console.log(result);

    return {
      status: !!result.length,
      userid,
    };
  }
}
