import { Module } from '@nestjs/common';
// import { AzureStorageService } from './azure-storage-service';
import { CommonModule } from '../../common';
import { AWSS3Service } from './aws-s3-service';
import { AWSSESService } from './aws-ses-service';
import { MongoDbService } from './mongodb-service';
import { MysqlService } from './mysql-service';
import { RedisService } from './redis-service';

/**
 * Module with database connections
 */
@Module({
    imports: [CommonModule],
    providers: [MongoDbService, MysqlService, AWSS3Service, AWSSESService, RedisService],
    exports: [MongoDbService, MysqlService, AWSS3Service, AWSSESService, RedisService]
})
export class DatabaseModule {}
