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



实际上，每个模块都是一个**共享模块**。一旦创建就能被任意模块重复使用。假设我们将在几个模块之间共享 `CatsService` 实例。 我们需要把 `CatsService` 放到 `exports` 数组中，如下所示: 

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

`NestJS`的中间件实际上等价于`express`的中间件: 

- 执行任何代码。
- 对请求和响应对象进行更改。
- 结束请求-响应周期。
- 调用堆栈中的下一个中间件函数。
- 如果当前的中间件函数没有结束请求-响应周期, 它必须调用 `next()` 将控制传递给下一个中间件函数。否则, 请求将被挂起。

`NestJS`中使用`@Injectable`装饰器来声明一个中间件，这个中间件类/函数，必须实现`NestMiddleware`接口，eg: 

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

PS: 注意使用 url param 参数的接口（如`@Get`':id')）一定要放到同类型接口最后面，因为 Nest 是从上到下顺序匹配的，如果将 `@Get('id')` 放到 `@Get('getXXX')` 前面，则无法调用到 `@Get('getXXX')`

使用 Nest 起后端服务，实现了 5 种 http/https 的数据传输方式: 

其中前两种是 url 中的: 

- `url param`:  url 中的参数，Nest 中使用`@Param`来取
- `query`: url 中 ? 后的字符串，Nest 中使用`@Query`来取

后三种是 body 中的: 

- `form urlencoded`:  类似 query 字符串，只不过是放在 body 中。Nest 中使用`@Body`来取，axios 中需要指定 content type 为 application/x-www-form-urlencoded，并且对数据用 qs 或者 query-string 库做 url encode
- `json`: json 格式的数据。Nest 中使用`@Body`来取，axios 中不需要单独指定 content type，axios 内部会处理。
- `form data`: 通过 ----- 作为 boundary 分隔的数据。主要用于传输文件，Nest 中要使用 FilesInterceptor 来处理其中的 binary 字段，用`@UseInterceptors`来启用，其余字段用`@Body`来取。axios 中需要指定 content type 为 multipart/form-data，并且用 FormData 对象来封装传输的内容。

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



### 6. HTTP状态码装饰器 `@HttpCode(code: number)`

默认情况下，响应的**状态码**总是默认为 **200**，除了 POST 请求（默认响应状态码为 **201**），我们可以通过在处理函数外添加 `@HttpCode（...）` 装饰器来轻松更改此行为。

```ts
@Post()
@HttpCode(204)
create() {
  return 'This action adds a new cat';
}
```

### 7. 路由重定向 `@Redirect(url: string, code?: number)`

### 8. 异常过滤器

内置的**异常层**负责处理整个应用程序中的所有抛出的异常。当捕获到未处理的异常时，最终用户将收到友好的响应（针对异常自动给出最佳实践的返回值）。

开箱即用，此操作由内置的全局异常过滤器执行，该过滤器处理类型 `HttpException`（及其子类）的异常。每个发生的异常都由全局异常过滤器处理, 当这个异常**无法被识别**时 (既不是 `HttpException` 也不是继承的类 `HttpException` ) , 用户将收到以下 `JSON` 响应:

```json
{
    "statusCode": 500,
    "message": "Internal server error"
}
```

如下，我们硬编码一个错误的发生: 

```ts
@Get()
async findAll() {
  throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
}
```

最终输出到客户端则是更友好的响应: 

```json
{
    "statusCode": 403,
    "message": "Forbidden"
}
```

也可以通过传入的第一个参数来控制最终返回的数据结构，第一个参数除了`string`也能接收`object`

#### 内置异常

为了减少样板代码，Nest 提供了一系列继承自核心异常 `HttpException` 的可用异常。所有这些都可以在 `@nestjs/common`包中找到: 

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

**使用异常过滤器**: 现在可以使用 `@UseFilters()` 将上面定义好的异常过滤器绑定到对应 `Controller` 上去

```ts
// xxx.controller.ts
@Post()
@UseFilters(new HttpExceptionFilter()) // --> 这里也可以直接传递类，让NestJS自行实例化 @UseFilters(HttpExceptionFilter) 这样也有助于NestJS进行实例的复用减少内存消耗
async create(@Body() createCatDto: CreateCatDto) {
  throw new ForbiddenException();
}
```

根据调用装饰器的不同位置，可以定义过滤器的适用范围: 

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

- **转换**: 管道将输入数据转换为所需的数据输出(例如，将字符串转换为整数)
- **验证**: 对输入数据进行验证，如果验证成功继续传递; 验证失败则抛出异常



#### 内置管道

`Nest` 自带九个开箱即用的管道，即: 

- `ValidationPipe`
- `DefaultValuePipe`
- `ParseIntPipe`
- `ParseFloatPipe`
- `ParseBoolPipe`
- `ParseArrayPipe`
- `ParseUUIDPipe`
- `ParseEnumPipe`
- `ParseFilePipe`

**使用管道**:  `Parse*Pipe`

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

### 10. IOC 控制反转

后端系统有很多的对象，这些对象之间的关系错综复杂，如果手动创建并组装对象比较麻烦，所以后端框架一般都提供了 IOC 机制。

IOC 机制是在 class 上标识哪些是可以被注入的，它的依赖是什么，然后从入口开始扫描这些对象和依赖，自动创建和组装对象。

Nest 里通过 @Controller 声明可以被注入的 controller，通过 @Injectable 声明可以被注入也可以注入别的对象的 provider，然后在 @Module 声明的模块里引入。

并且 Nest 还提供了 Module 和 Module 之间的 import，可以引入别的模块的 provider 来注入（只有别的模块 exports 了的 provider 才可以使用）。

虽然 Nest 这套实现了 IOC 的模块机制看起来繁琐，但是却解决了后端系统的对象依赖关系错综复杂的痛点问题。

### 11. 代码调试

调试模式 `node --inspect-bre xxx.js`

复杂的代码需要用断点调试查看调用栈和作用域，也就是代码的执行路线，然后单步执行。

node 代码可以加上 --inspect 或者 --inspect-brk 启动调试 ws 服务，然后用 Chrome DevTools 或者 vscode debugger 连上来调试。

nest 项目的调试也是 node 调试，可以使用 nest start --debug 启动 ws 服务，然后在 vscode 里 attach 上来调试，也可以添加个调试配置来运行 npm run start:dev。

nest 项目最方便的调试方式还是在 VSCode 里添加 npm run start:dev 的调试配置。

此外，我们还理解了 logpoint、条件断点、异常断点等断点类型。

学会了 nest 项目的调试，就可以直接在代码里打断点了。

### 12. 全局模块

NestJS 中通过 exports 导出本模块的可分享服务，再使用 import 导入模块以共享服务，如下: 

```ts
// AModule
@Module({
  controllers: [AController],
  providers: [AService],
  exports: [AService] // 将 AService 作为可共享服务
})
export default class AModule {};
```

```ts
// BModule
@Module({
  controllers: [BController],
  providers: [BService],
  imports: [AModule] // 导入 A 模块，这样我们就能够在 B 模块中注入 AService 了
})
export default class BModule {};
// BController
@Controller('B')
export class PostsController {
  constructor(private readonly AService: AService) {} // 在 BController 中注入 AService
  ...
}
// BService
@Injectable()
export class AppService {
  constructor(private readonly AService: AService) {} // 也可在 BService 中注入 AService
}
```

而如果 `AService` 在很多个模块都需要使用的话，每一次 imports 就会显得较为烦琐，此时可以将 A 模块使用`@Global()`设为全局模块，这样其他模块则不再需要导入
```ts
// AModule
@Global()
@Module({
  controllers: [AController],
  providers: [AService],
  exports: [AService] // 将 AService 作为可共享服务
})
export default class AModule {};
```

*不过全局模块还是尽量少用，不然注入的很多 provider 都不知道来源，会降低代码的可维护性。*

### 13. 生命周期

触发顺序都是: 先子后父，先深度遍历进去，再一个个触发退出来

> Controllers -> Providers -> Module

### 启动时
`onModuleInit`、`onApplicationBootstrap`

### 销毁时
`onModuleDestroy`、`beforeApplicationShutdown`、`onApplicationShutdown`

在定义模块/Controller/Provider时可以实现它

```ts
@Controller()
export default class AController implements onModuleInit, onApplicationBootstrap {
  ...

  // 支持异步
  async onModuleInit() {
    // do something
  },

  onApplicationBootstrap() {
    // do something
  }
}
```

PS: 可以在模块内应用 `import { ModuleRef } from '@nestjs/core'` 获取当前模块对象，在模块对象上通过 token 获取到 provider

```ts
...
// 先注入
constructor(private moduleRef: ModuleRef) {}

onApplicationShutdown() {
  const XService = this.moduleRef.get<XService>(XService);

  // do something
}
```

### 14. AOP

AOP 的好处是可以把一些通用逻辑分离到切面中，保持业务逻辑的纯粹性，这样切面逻辑可以复用，还可以动态的增删。

像 Express 的中间件的洋葱圈模型也是一种 AOP 的实现。

而 Nest 实现 AOP 的方式更多，一共有五种，包括 Middleware、Guard、Pipe、Interceptor、ExceptionFilter: 

guard、interceptor、middleware、pipe、filter 都是 Nest 的特殊 class，无需通过 Providers 在模块内注入，当你通过 @UseXxx 使用它们的时候，Nest 就会扫描到它们，创建对象它们的对象加到容器里，就已经可以注入依赖了。

#### 1）Middleware 中间件

Nest 的底层是 Express，所以自然也可以使用中间件，但是做了进一步的细分，分为了全局中间件和路由中间件: 

全局中间件就是 Express 的那种中间件，在请求之前和之后加入一些处理逻辑，每个请求都会走到这里: 

```ts
const app = await NestFactory.create(AppModule)
app.use(LoggerMiddleware) // 全局中间件
app.listen(3000)
```

路由中间件则是针对某个路由来说的，范围更小一些: 

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

#### 2）Guard 路由守卫 —— 路由切面

**Guard 是路由守卫的意思，可以用于在调用某个 Controller 之前判断权限，返回 true 或者 false 来决定是否放行**

Guard 要实现 `CanActivate` 接口，实现 `canActivate` 方法，可以从 context 拿到请求的信息，然后做一些权限验证等处理之后返回 true 或者 false

通过 @Injectable 装饰器加到 IOC 容器中，然后就可以在某个 Controller 启用了

```ts
@Injectable()
export default class RolesGuard implements CanActive {
  canActive(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return true
  }
}
```

Controller 本身不需要做啥修改，却透明的加上了权限判断的逻辑，这就是 AOP 架构的好处。

而且，就像 Middleware 支持全局级别和路由级别一样，Guard 也可以全局启用: 

```ts
// 全局使用
const app = ...

app.useGlobalGuards(new RolesGuard())

// Controller 使用
@Controller('cats')
@UseGuards(RolesGuard)
export class CatsController {}
```

#### 3）Interceptor 拦截器 —— Controller切面

Interceptor 是拦截器的意思，可以在目标 Controller 方法前后加入一些逻辑。（拦截器是使用 @Injectable() 装饰器注解的类。拦截器应该实现 NestInterceptor 接口）

Interceptor 要实现 NestInterceptor 接口，实现 intercept 方法，调用 next.handle() 就会调用目标 Controller，可以在之前和之后加入一些处理逻辑。

```ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('Before...');

    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap(() => console.log(`After... ${Date.now() - now}ms`)),
      );
  }
}
```

Interceptor 支持每个路由单独启用，只作用于某个 controller，也同样支持全局启用，作用于全部 controller: 

```ts
// 局部
@UseInterceptors(new LoggingInterceptor())
export class XXXController {}

// 全局
app.useGlobalInterceptors(new LoggingInterceptor())
```

**有的同学可能会问：Nest 的 middleware 和 interceptor 都是在请求前后加入一些逻辑的，这俩区别是啥呢？**

1. interceptor 是能从 ExecutionContext 里拿到目标 class 和 handler，进而通过 reflector 拿到它的 metadata 等信息的，这些 middleware 就不可以。
2. 再就是 interceptor 里是可以用 rxjs 的操作符来组织响应处理流程的

*它们都是 Nest AOP 思想的实现，但是 interceptor 更适合处理与具体业务相关的逻辑，而 middleware 适合更通用的处理逻辑*

#### 4）Pipe 管道 —— 参数切面

Pipe 是管道的意思，用来对参数做一些检验和转换

Pipe 要实现 PipeTransform 接口，实现 transform 方法，里面可以对传入的参数值 value 做参数验证，比如格式、类型是否正确，不正确就抛出异常。也可以做转换，返回转换后的值

内置的有 9 个 Pipe，从名字就能看出它们的意思: 

- ValidationPipe
- ParseIntPipe
- ParseBoolPipe
- ParseArrayPipe
- ParseUUIDPipe
- DefaultValuePipe
- ParseEnumPipe
- ParseFloatPipe
- ParseFilePipe

同样，Pipe 可以只对某个参数生效，某个路由生效，也可以对每个路由都生效: 

```ts
// 单个参数生效
@Get()
async hello(@Query('age', ParseIntPipe) age: number) {}

// 单个方法/路由
@Post()
@UsePipes(ValidationPipe)
async hello() {}

// 全局
app.useGlobalPipes(new ValidationPipe())
```

#### 5）ExceptionFilter 异常过滤器

ExceptionFilter 可以对抛出的异常做处理，返回对应的响应: 

上面有提就不说了

[异常过滤器](#异常过滤器-catch)

#### 五种AOP机制的顺序

Middleware、Guard、Pipe、Interceptor、ExceptionFilter 都可以透明的添加某种处理逻辑到某个路由或者全部路由，这就是 AOP 的好处。

但是它们之间的顺序关系是什么呢？

从源码看，进入路由后会先调用 Guards ，判断权限，如果没有权限就抛出异常了 ->
如果有权限，就会调用到 Interceptors，拦截器组织了一个链条，一个个的调用，最后会调用到 controller 的方法 ->
调用 controller 方法之前，会使用 pipe 对参数做处理 ->
ExceptionFilter 的调用时机很容易想到，就是在响应之前对异常做一次处理。
而 MiddleWare 则是 express 的概念，Nest 只是继承了下，那个是在最外层被调用。

![AOP机制顺序图](./uploads/AOP_order.awebp)

MVC 就是 Model、View Controller 的划分，请求先经过 Controller，然后调用 Model 层的 Service、Repository 完成业务逻辑，最后返回对应的 View。

IOC 是指 Nest 会自动扫描带有 `@Controller`、@Injectable 装饰器的类，创建它们的对象，并根据依赖关系自动注入它依赖的对象，免去了手动创建和组装对象的麻烦。

AOP 则是把通用逻辑抽离出来，通过切面的方式添加到某个地方，可以复用和动态增删切面逻辑。

Nest 的 Middleware、Guard、Interceptor、Pipe、ExceptionFilter 都是 AOP 思想的实现，只不过是不同位置的切面，它们都可以灵活的作用在某个路由或者全部路由，这就是 AOP 的优势。

### 15. `Metadata`和`Reflector`

> Metadata 是一个 Reflector 的 API，目前还在草案阶段为进入 ES 标准。

`Reflect.defineMetadata` 和 `Reflect.getMetadata` 分别用于设置和获取某个类的元数据，如果最后传入了属性名，还可以单独为某个属性设置元数据。

```ts
Reflect.defineMetadata(metadataKey, metadataValue, target);

Reflect.defineMetadata(metadataKey, metadataValue, target, propertyKey);


let result = Reflect.getMetadata(metadataKey, target);

let result = Reflect.getMetadata(metadataKey, target, propertyKey);
```

那元数据存在哪呢？

存在类或者对象上呀，如果给类或者类的静态属性添加元数据，那就保存在类上，如果给实例属性添加元数据，那就保存在对象上，用类似 [[metadata]] 的 key 来存的。

该 API 也支持装饰器的使用方式

```ts
@Reflect.metadata(metadataKey, metadataValue)
class C {

  @Reflect.metadata(metadataKey, metadataValue)
  method() {
    ...
  }
}
```

这就是 nest 的核心实现原理：**通过装饰器给 class 或者对象添加 metadata，并且开启 ts 的 emitDecoratorMetadata 来自动添加类型相关的 metadata，然后运行的时候通过这些元数据来实现依赖的扫描，对象的创建等等功能。**

Nest 的装饰器都是依赖 reflect-metadata 实现的，而且还提供了一个 `@SetMetadata` 的装饰器让我们可以给 class、method 添加一些 metadata

> 可以使用 forwardRef() 函数来导入，以解决循环依赖的问题，这样各个 module之前可以互相 imports 注入了。
>
> 它的原理就是 nest 会先创建 Module、Provider，之后再把引用转发到对方，也就是 forward ref。

### 16. 动态 Module

Module 可以传入 options 动态产生，这叫做动态 Module，你还可以把传入的 options 作为 provider 注入到别的对象里。

建议的动态产生 Module 的方法名有 register、forRoot、forFeature 3种。

- register：用一次注册一次
- forRoot：只注册一次，用多次，一般在 AppModule 引入
- forFeature：用了 forRoot 之后，用 forFeature 传入局部配置，一般在具体模块里 imports

并且这些方法都可以写 xxxAsync 版本，也就是传入 useFactory 等 option，内部注册异步 provider。

这个过程也可以用 ConfigurableModuleBuilder 来生成。通过 setClassMethodName 设置方法名，通过 setExtras 设置额外的 options 处理逻辑。

并且返回的 class 都有 xxxAsync 的版本。

这就是动态模块的定义方式，后面用到 typeorm、mongoose 等模块会大量见到这种模块。

> PS：动态模块要说用的地方多呢，也多。要说少呢，也少。比如你有不同的邮件发送渠道（阿里云，SES等），如果有个需求是需要支持多种邮件发送渠道，当某一个主渠道不可用的情况下，使用备用渠道发送邮件，这时候就可以创建一个MailModule(channel: string)的动态邮件发送渠道



## 内置装饰器汇总

- `@Module`:  声明 Nest 模块
- `@Controller`: 声明模块里的 controller
- `@Injectable`: 声明模块里可以注入的 provider
- `@Inject`: 通过 token 手动指定注入的 provider，token 可以是 class 或者 string
- `@Optional`: 声明注入的 provider 是可选的，可以为空
- `@Global`: 声明全局模块
- `@Catch`: 声明 exception filter 处理的 exception 类型
- `@UseFilters`: 路由级别使用 exception filter
- `@UsePipes`: 路由级别使用 pipe
- `@UseInterceptors`: 路由级别使用 interceptor
- `@SetMetadata`: 在 class 或者 handler 上添加 metadata
- `@Get`、`@Post`、`@Put`、`@Delete`、`@Patch`、`@Options`、`@Head`: 声明 get、post、put、delete、patch、options、head 的请求方式
- `@Param`: 取出 url 中的参数，比如 /aaa/:id 中的 id
- `@Query`: 取出 query 部分的参数，比如 /aaa?name=xx 中的 name
- `@Body`: 取出请求 body，通过 dto class 来接收
- `@Headers`: 取出某个或全部请求头
- `@Session`: 取出 session 对象，需要启用 express-session 中间件
- `@HostParm`:  取出 host 里的参数
- `@Req`、`@Request`: 注入 request 对象
- `@Res`、`@Response`: 注入 response 对象，一旦注入了这个 Nest 就不会把返回值作为响应了，除非指定 passthrough 为true
- `@Next`: 注入调用下一个 handler 的 next 方法
- `@HttpCode`:  修改响应的状态码
- `@Header`: 修改响应头
- `@Redirect`: 指定重定向的 url
- `@Render`: 指定渲染用的模版引擎

### 自定义装饰器

1. 路由装饰器，如设置 Metadata 等的：

```ts
// setRole.ts
import { SetMetadata } from '@nestjs/common'

export const SetRole = (roles: Role[]) => SetMetadata('role', roles);

// xx.controller.ts
...
@Controller()
export class XXController {
  ...
  @SetRole('admin') // ===> SetMetadata('role', 'admin') 封装了这个方法
	@UseGuards(RoleGuard)
	getList(...) {...}
}

// roleGuard.ts
...
// 获取设置的 role
const requiredRoles = this.reflector.get<Role[]>('role', context.getHandler());
...
```

2. 聚合装饰器

很多情况下针对某个路由 handler 我们都会使用多个装饰器，如果这一组装饰器多处重复，这可以使用自定义装饰器来把它们合成一个进行聚合：

```ts
// 未聚合前
@Get('list')
@SetRole('admin')
@UseGuards(RoleGuard)
getList(...) {...}

// 自定义装饰器
import {
  Get,
  applyDecorators,
  CanActivate
} from '@nestjs/common';
import {SetRole} from '...'

export const Myd = (path: string, role: string, guard: CanActivate) =>
  applyDecorators(Get(path), SetRole(role), UseGuards(guard));

// 使用自定义装饰器
@Myd('list', 'admin', RoleGuard)
getList(...) {...}

```

3. 参数装饰器

自定义类似@Param这些的参数装饰器

```ts
// 自定义一个 MyHeaders 的装饰器来取出 req 中的 header
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const MyHeaders = createParamDecorator(
  (key: string, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    return key ? request.headers[key.toLowerCase()] : request.headers;
  },
);

// 使用
@Get('list')
getList(@MyHeaders('Accept') accept: string) {...}
```



## 架构组织

