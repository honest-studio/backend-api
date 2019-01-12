import { Module } from '@nestjs/common';
import { MongoDbService } from './mongodb-service';
import { EosSyncService } from './eos-sync-service';
import { MysqlService } from './mysql-service';
import { CommonModule } from '../../common';

/**
 * Module with database connections
 */
@Module({
    imports: [CommonModule],
    providers: [MongoDbService, EosSyncService, MysqlService],
    exports: [MongoDbService, MysqlService]
})
export class DatabaseModule {}
