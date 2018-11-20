import { Controller, Get, Param } from '@nestjs/common';
import { ProposalsService } from './proposals.service';

@Controller('v1/proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get(':hash')
  getProposal(@Param('hash') hash): string {
    return this.proposalsService.get(hash);
  }
}
