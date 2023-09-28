import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { PostModel, Post as PostType } from './post.model';

@Controller('posts')
@ApiTags('诗歌')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({
    summary: '诗歌列表',
  })
  async index(
    @Query('pageNumber', ParseIntPipe) pageNumber: number,
    @Query('pageSize', ParseIntPipe) pageSize?: number,
  ) {
    pageSize = !pageSize && pageSize !== 0 ? 20 : pageSize;
    const skip = pageSize * (pageNumber - 1);
    return await PostModel.find().skip(skip).limit(pageSize);
  }

  @Get(':title')
  @ApiOperation({
    summary: '获取诗歌详情',
  })
  async detail(@Param('title') title: string) {
    return {
      data: await this.postsService.returnTestPost(title),
    };
  }

  @Post(':userid')
  @ApiOperation({
    summary: '创建诗歌',
  })
  create(@Body() data: PostType, @Param('userid') userid: string) {
    return this.postsService.createPost(data, userid);
  }

  @Put(':id')
  @ApiOperation({ summary: '编辑诗歌' })
  update(@Body() data: PostType, @Param('id') id: string) {
    return {
      id,
      data,
    };
  }

  @Delete(':title')
  @ApiOperation({ summary: '删除诗歌' })
  deleteBlog(@Param('title') title: string) {
    return this.postsService.deletePost(title);
  }
}
