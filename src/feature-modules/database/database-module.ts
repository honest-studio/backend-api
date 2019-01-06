import { Module } from '@nestjs/common';
import { MongoDbService } from './mongodb-service';
import { EosSyncService } from './eos-sync-service';
import { CommonModule } from '../../common';
import { ConfigLoaderModule } from '../../common/config-loader';


/**
 * Module with database connections
 */
@Module({
    imports: [ConfigLoaderModule, CommonModule],
    providers: [MongoDbService, EosSyncService],
    exports: [MongoDbService]
})
export class DatabaseModule {}
