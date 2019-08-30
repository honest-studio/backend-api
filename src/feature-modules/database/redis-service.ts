import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
    private subscriber: Redis.Redis;
    private redis: Redis.Redis;
    private subscribed: Promise<boolean>;

    constructor() { 
        this.redis = new Redis();
    }

    connection() {
        return this.redis;
    }
    
}
