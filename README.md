[toc]

## 概述

### 1. 定义模块 `@Module`

> @Module(opts: {providers, controllers, imports, exports })

| 属性 | 值含义 |
| ----------- | ---------------------------------------------------------- |
| providers   | 由 Nest 注入器实例化的提供者，并且可以至少在整个模块中共享 |
| controllers | 必须创建的一组控制器                                       |
| imports     | 导入模块的列表，这些模块导出了此模块中所需提供者           |
| exports     | 由本模块提供并应在其他模块中可用的提供者的子集。           |

#### 共享模块

在 Nest 中，默认情况下，模块是**单例**，因此您可以轻松地在多个模块之间共享**同一个**提供者实例。



实际上，每个模块都是一个**共享模块**。一旦创建就能被任意模块重复使用。假设我们将在几个模块之间共享 `CatsService` 实例。 我们需要把 `CatsService` 放到 `exports` 数组中，如下所示：

```ts
// cats.module.ts
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService]
})
export class CatsModule {}
```

现在，每个导入 `CatsModule` 的模块都可以访问 `CatsService` ，并且它们将共享相同的 `CatsService` 实例。

#### 全局模块 `@Global`

如果某个模块你想在任意其他模块中使用，而又烦心于需要在每个使用的地方`imports`导入。

`@Global` 装饰器使模块成为全局作用域。 全局模块应该只注册一次，最好由根或核心模块注册。 在下面的例子中，`CatsService` 组件将无处不在，而想要使用 `CatsService` 的模块则不需要在 `imports` 数组中导入 `CatsModule`。

```ts
// cats.modules.ts
import { Module, Global } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Global()
@Module({
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}

// other.controllers.ts 这样可以直接在其他地方使用而无需在 other 的模块内导入 cats 模块了
import { CatsService } from '../cats/cats.service';
export default class XXXControllers {
  constructor(private readonly catsService: CatsService) {...}
}
```



### 2. 定义控制器 @Controller



> @Controller(prefixRouteName?: string | opt?: { path?: string; host?: string; })



控制器负责处理传入的**请求**和向客户端返回**响应**。



控制器的目的是接收应用的特定请求。**路由**机制控制哪个控制器接收哪些请求。通常，每个控制器有多个路由，不同的路由可以执行不同的操作。



为了创建一个基本的控制器，我们使用类和`装饰器`。装饰器将类与所需的元数据相关联，并使 Nest 能够创建路由映射（将请求绑定到相应的控制器）。



### 3. 中间件

*中间件是在路由处理程序 **之前** 调用的函数。 中间件函数可以访问请求和响应对象，以及应用程序请求响应周期中的 `next()` 中间件函数。 `next()` 中间件函数通常由名为 `next` 的变量表示。*

`NestJS`的中间件实际上等价于`express`的中间件：

- 执行任何代码。
- 对请求和响应对象进行更改。
- 结束请求-响应周期。
- 调用堆栈中的下一个中间件函数。
- 如果当前的中间件函数没有结束请求-响应周期, 它必须调用 `next()` 将控制传递给下一个中间件函数。否则, 请求将被挂起。

`NestJS`中使用`@Injectable`装饰器来声明一个中间件，这个中间件类/函数，必须实现`NestMiddleware`接口，eg：

```ts
// log.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LogMiddleware implements NestMiddleware {
  use(req: Request, res: Response, nest: NextFunction) {
    console.log('...some log.')
    next()
  }
}
```

**`Nest`中间件完全支持依赖注入。 就像提供者和控制器一样，它们能够**注入**属于同一模块的依赖项（通过 `constructor` ）。**

#### 使用中间件

中间件不能在 `@Module()` 装饰器中列出。我们必须使用模块类的 `configure()` 方法来设置它们。包含中间件的模块必须实现 `NestModule` 接口。我们将 `LoggerMiddleware` 设置在 `ApplicationModule` 层上。

```ts
// app.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('cats'); // 可以使用forRoutes来限制该中间件的应用 路由/方法 等等 .forRoutes({ path: 'cats', method: RequestMethod.GET }); 也可以直接穿入 Controller 来指定应用范围
  }
}
```

#### 函数式中间件

当您的中间件没有任何依赖关系时，我们可以考虑使用函数式中间件。

```ts
export function logger(req, res, next) {
  console.log('functional middleware')
  next();
}


// one.module.ts
consumer
  .apply(logger) // 应用该函数式中间件
  .forRoutes(CatsController);
```

#### 多个中间件

可以在 `apply()`中使用`,`来应用多个中间件

```ts
consumer
	.apply(cors(), picts, logger)
	...
```

#### 全局中间件

可以直接在整个`App`的实例上将其绑定

```ts
// main.ts
const app = await NestFactory.create(AppModule);
app.use(logger);
await app.listen(3000);
```





### 4. HTTP方法装饰器

| 装饰器   | 对应方法                                         |
| -------- | ------------------------------------------------ |
| @Get     | GET                                              |
| @Post    | POST                                             |
| @Put     | PUT                                              |
| @Delete  | DELETE                                           |
| @Patch   | PATCH                                            |
| @Options | OPTIONS                                          |
| @Head    | HEAD                                             |
| @All     | 用于定义一个用于处理所有 HTTP 请求方法的处理程序 |

#### 路由通配符

*路由同样支持模式匹配。例如，星号被用作通配符，将匹配任何字符组合。*

```ts
@Get('ab*cd')
findAll() {
  return 'This route uses a wildcard';
}
```

路由路径 `'ab*cd'` 将匹配 `abcd` 、`ab_cd` 、`abecd` 等。字符 `?` 、`+` 、 `*` 以及 `()` 是它们的正则表达式对应项的子集。连字符（`-`） 和点（`.`）按字符串路径逐字解析。

### 5. 自动帮助获取底层平台对应参数的装饰器
| 装饰器 | 对应底层参数对象 |
| ------------------------- | --------------------------------- |
| `@Request()，@Req()`      | `req`                             |
| `@Response()，@Res()*`    | `res`                             |
| `@Next()`                 | `next`                            |
| `@Session()`              | `req.session`                     |
| `@Param(key?: string)`    | `req.params`/`req.params[key]`    |
| `@Body(key?: string)`     | `req.body`/`req.body[key]`       |
| `@Query(key?: string)`    | `req.query`/`req.query[key]`      |
| `@Headers(name?: string)` | `req.headers`/`req.headers[name]` 也可以直接在方法顶部用 @Header('Content-Type', 'text/plain') 来指定该接口响应头 |
| `@Ip()`                   | `req.ip`                          |
| `@HostParam()`            | `req.hosts`                       |



### 6. HTTP状态码装饰器 @HttpCode(code: number)

默认情况下，响应的**状态码**总是默认为 **200**，除了 POST 请求（默认响应状态码为 **201**），我们可以通过在处理函数外添加 `@HttpCode（...）` 装饰器来轻松更改此行为。

```ts
@Post()
@HttpCode(204)
create() {
  return 'This action adds a new cat';
}
```

### 7. 路由重定向 @Redirect(url: string, code?: number)

### 8. 异常过滤器

内置的**异常层**负责处理整个应用程序中的所有抛出的异常。当捕获到未处理的异常时，最终用户将收到友好的响应（针对异常自动给出最佳实践的返回值）。

开箱即用，此操作由内置的全局异常过滤器执行，该过滤器处理类型 `HttpException`（及其子类）的异常。每个发生的异常都由全局异常过滤器处理, 当这个异常**无法被识别**时 (既不是 `HttpException` 也不是继承的类 `HttpException` ) , 用户将收到以下 `JSON` 响应:

```json
{
    "statusCode": 500,
    "message": "Internal server error"
}
```

如下，我们硬编码一个错误的发生：

```ts
@Get()
async findAll() {
  throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
}
```

最终输出到客户端则是更友好的响应：

```json
{
    "statusCode": 403,
    "message": "Forbidden"
}
```

也可以通过传入的第一个参数来控制最终返回的数据结构，第一个参数除了`string`也能接收`object`

#### 内置异常

为了减少样板代码，Nest 提供了一系列继承自核心异常 `HttpException` 的可用异常。所有这些都可以在 `@nestjs/common`包中找到：

- `BadRequestException`
- `UnauthorizedException`
- `NotFoundException`
- `ForbiddenException`
- `NotAcceptableException`
- `RequestTimeoutException`
- `ConflictException`
- `GoneException`
- `PayloadTooLargeException`
- `UnsupportedMediaTypeException`
- `UnprocessableException`
- `InternalServerErrorException`
- `NotImplementedException`
- `BadGatewayException`
- `ServiceUnavailableException`
- `GatewayTimeoutException`

#### 异常过滤器 `@Catch()`

有时候，我们像完全对异常处理掌握控制权，此时则可以使用自定义异常过滤器，为此我们将访问底层的`req`，`res`

```ts
// http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

// 捕获HttpException异常的实例，并修改异常的响应
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(), // 针对这个异常，返回时间戳
        path: request.url, // 返回路由url
      });
  }
}
```

**使用异常过滤器**：现在可以使用 `@UseFilters()` 将上面定义好的异常过滤器绑定到对应 `Controller` 上去

```ts
// xxx.controller.ts
@Post()
@UseFilters(new HttpExceptionFilter()) // --> 这里也可以直接传递类，让NestJS自行实例化 @UseFilters(HttpExceptionFilter) 这样也有助于NestJS进行实例的复用减少内存消耗
async create(@Body() createCatDto: CreateCatDto) {
  throw new ForbiddenException();
}
```

根据调用装饰器的不同位置，可以定义过滤器的适用范围：

1. 某个方法，即如上述
2. 整个控制器

```ts
// xx.controller.ts
@UseFilters(HttpExceptionFilter)
export class xxController {}
```

3. 全局

```ts
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(HttpExceptionFilter);
  await app.listen(3000);
}
bootstrap();
```

### 9. 管道

管道是具有 `@Injectable()` 装饰器的类。管道应实现 `PipeTransform` 接口。



管道有两个典型的应用场景:

- **转换**：管道将输入数据转换为所需的数据输出(例如，将字符串转换为整数)
- **验证**：对输入数据进行验证，如果验证成功继续传递; 验证失败则抛出异常



#### 内置管道

`Nest` 自带九个开箱即用的管道，即：

- `ValidationPipe`
- `DefaultValuePipe`
- `ParseIntPipe`
- `ParseFloatPipe`
- `ParseBoolPipe`
- `ParseArrayPipe`
- `ParseUUIDPipe`
- `ParseEnumPipe`
- `ParseFilePipe`

**使用管道**： `Parse*Pipe`

```typescript
// 将自动在函数执行前将 id 参数转换成 integer --> 当无法被转换时，将抛出异常 Validation failed (numeric string is expected)
@Get(':id')
async findOne(@Param('id', ParseIntPipe) id: number) {
  return this.catsService.findOne(id);
}

// 也可以自行实例化，传入自定义异常返回
@Get(':id')
async findOne(
  @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }))
  id: number,
) {
  return this.catsService.findOne(id);
}
```

## 架构组织

博客系统API：

1. 用户模块

2. 文章模块

3. 评论模块