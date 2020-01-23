import { Module } from '@nestjs/common';
import { ConfigService } from './config-service';
import { IpfsService } from './ipfs-service';

/**
 * Common module with shared utils for rest of the app
 */
@Module({
    providers: [
        {
            provide: ConfigService,
            useValue: new ConfigService(`.env`)
        },
        IpfsService
    ],
    exports: [ConfigService, IpfsService]
})
export class CommonModule {}
