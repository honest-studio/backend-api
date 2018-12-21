import { Module } from '@nestjs/common';
import { MongoDbService } from './mongodb-service';
import { EosSyncService } from './eos-sync-service';
import { CommonModule } from '../../common';

/**
 * Module with database connections
 */
@Module({
    imports: [CommonModule],
    providers: [MongoDbService, EosSyncService],
    exports: [MongoDbService]
})
export class DatabaseModule {}
