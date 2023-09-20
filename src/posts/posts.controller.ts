import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';

class CreatePostDto {
  @ApiProperty({ description: '标题' })
  title: string;
  @ApiProperty({ description: '内容' })
  content: string;
}

@Controller('posts')
@ApiTags('文章')
export class PostsController {
  @Get()
  @ApiOperation({
    summary: '文章列表',
  })
  index() {
    return {
      id: 1,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: '获取文章详情',
  })
  detail(@Param('id') id: string) {
    return {
      msg: 'ss',
      id,
    };
  }

  @Post(':userid')
  @ApiOperation({
    summary: '创建文章',
  })
  create(@Body() data: CreatePostDto, @Param('userid') userid: string) {
    console.log(data);
    return {
      success: true,
      list: [],
      userid,
      data,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: '编辑文章' })
  update(@Body() data: CreatePostDto, @Param('id') id: string) {
    return {
      id,
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除文章' })
  deleteBlog(@Param('id') id: string) {
    return {
      id,
    };
  }
}
