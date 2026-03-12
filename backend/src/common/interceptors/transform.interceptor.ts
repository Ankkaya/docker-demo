import { Injectable, NestInterceptor, ExecutionContext, CallHandler, StreamableFile } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  code: number;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;
    
    return next.handle().pipe(
      map(data => {
        if (data instanceof StreamableFile) {
          return data as unknown as Response<T>;
        }

        return {
          code: statusCode,
          message: 'success',
          data: data || null
        };
      })
    );
  }
}
