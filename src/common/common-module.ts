import { Module } from '@nestjs/common';
import { ConfigLoaderModule, ConfigService } from './config-loader';
import { IpfsService } from './ipfs-service';
import { MongoClient, Db, Collection } from 'mongodb';
import { StatusHubService } from './status-hub-service';
import { DiToken } from '../shared/constants/internals';

/**
 * Common module with shared utils for rest of the app
 */
@Module({
    imports: [ConfigLoaderModule],
    providers: [
        StatusHubService,
        IpfsService,
        {
            provide: DiToken.MongoDbClientToken,
            useFactory: async (configService: ConfigService) => {
                const mongoCfg = configService.get('mongoConfig');
                console.log('loaded mongoCfg:', mongoCfg);
                return await MongoClient.connect(
                    mongoCfg.mongoConnUrl,
                    {
                        poolSize: 10
                    }
                );
                /*
                try {
                    const mongoClient = await MongoClient.connect(
                        mongoCfg.mongoConnUrl,
                        {
                            poolSize: 10
                        }
                    );
                    return mongoClient;
                } catch (err) {
                    let errMsg = 'Unable to connect to MongoDb: ';
                    console.error(errMsg, err);
                    throw new Error(errMsg);
                }
                */
            },
            inject: [ConfigService]
        }
    ],
    exports: [StatusHubService, IpfsService, DiToken.MongoDbClientToken]
})
export class CommonModule {}
