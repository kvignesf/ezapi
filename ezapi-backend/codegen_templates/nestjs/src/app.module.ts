// app.module.ts
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ErrorLoggingInterceptor } from './error-logging.interceptor';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: ErrorLoggingInterceptor ,
    },
  ],
})
export class AppModule {}
