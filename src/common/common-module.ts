import { Module } from '@nestjs/common';
import { ConfigService } from './config-service';
import { IpfsService } from './ipfs-service';
import { StatusHubService } from './status-hub-service';

/**
 * Common module with shared utils for rest of the app
 */
@Module({
    providers: [
        {
            provide: ConfigService,
            // useValue: new ConfigService(`${process.env.NODE_ENV}.env`)
            useValue: new ConfigService(`.env`)
        },
        StatusHubService,
        IpfsService
    ],
    exports: [ConfigService, StatusHubService, IpfsService]
})
export class CommonModule {}
