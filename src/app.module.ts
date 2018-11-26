import { Module } from '@nestjs/common';
import { ApiService } from './api/api.service';
import { ApiController } from './api/api.controller';

@Module({
  imports: [],
  controllers: [ApiController],
  providers: [ApiService],
})
export class AppModule {}
