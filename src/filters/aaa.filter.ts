import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { AaaExcepiton } from './aaa.exception';

// 指定这个 filter 捕获 AaaException 这种异常
@Catch(AaaExcepiton)
export class AaaFilter implements ExceptionFilter {
  catch(exception: AaaExcepiton, host: ArgumentsHost) {
    console.log(exception, host);
  }
}
