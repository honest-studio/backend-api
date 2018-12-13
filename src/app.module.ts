import { Module } from '@nestjs/common';
import { ProposalController } from './proposal/proposal.controller';
import { ProposalService } from './proposal/proposal.service';
import { WikiController } from './wiki/wiki.controller';
import { WikiService } from './wiki/wiki.service';
import { CommonModule } from './common';
import { RecentActivityController } from './recent-activity/recent-activity.controller';
import { RecentActivityService } from './recent-activity/recent-activity.service';
import { ChainController, ChainService } from './chain';
import { EosClientModule } from './feature-modules';

@Module({
    imports: [CommonModule, EosClientModule],
    controllers: [ProposalController, WikiController, RecentActivityController, ChainController],
    providers: [ProposalService, WikiService, RecentActivityService, ChainService]
})
export class AppModule {}
