import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
    private redis: Redis;

    constructor() { 
        this.redis = new Redis();
    }

    connection(): AppConnectionInstance {
        return this.redis;
    }

}
