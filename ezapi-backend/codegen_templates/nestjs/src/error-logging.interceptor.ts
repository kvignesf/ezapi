import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
  } from '@nestjs/common';
  import { Observable, throwError } from 'rxjs';
  import { catchError } from 'rxjs/operators';
  import * as log4js from 'log4js';
  
  @Injectable()
  export class ErrorLoggingInterceptor implements NestInterceptor {
    private readonly logger = log4js.getLogger();
  
    constructor() {
      log4js.configure({
        appenders: { errorLogFile: { type: 'file', filename: 'error.log' } },
        categories: { default: { appenders: ['errorLogFile'], level: 'all' } },
      });
    }
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      return next.handle().pipe(
        catchError((error) => {
          this.logger.error(`Error occurred: ${error.message}`, error);
          return throwError(()=> new Error(error));
        }),
      );
    }
  }
  