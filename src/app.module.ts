import { Module } from '@nestjs/common';
import { ProposalController } from './proposal/proposal.controller';
import { ProposalService } from './proposal/proposal.service';
import { WikiController } from './wiki/wiki.controller';
import { WikiService } from './wiki/wiki.service';
import { ConfigModule } from './config';
import { RecentActivityController } from './recent-activity/recent-activity.controller';
import { RecentActivityService } from './recent-activity/recent-activity.service';

@Module({
    imports: [ConfigModule],
    controllers: [ProposalController, WikiController, RecentActivityController],
    providers: [ProposalService, WikiService, RecentActivityService]
})
export class AppModule {}
