import { Module } from '@nestjs/common';
import { ProposalsService } from './proposals/proposals.service';
import { ProposalsController } from './proposals/proposals.controller';

@Module({
  imports: [],
  controllers: [ProposalsController],
  providers: [ProposalsService],
})
export class AppModule {}
