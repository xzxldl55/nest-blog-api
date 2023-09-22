import { Injectable } from '@nestjs/common';

const testPosts = {
  title: '测试的',
  content: '嘻嘻哈哈',
};

@Injectable()
export class PostsService {
  returnTestPost(): typeof testPosts {
    return testPosts;
  }
}
