import {
  ExceptionFilter,
  Get,
  UseFilters,
  applyDecorators,
} from '@nestjs/common';

// 自定义装饰器对多个装饰器整合
export const Myd = (filter: ExceptionFilter) =>
  applyDecorators(Get(), UseFilters(filter));
