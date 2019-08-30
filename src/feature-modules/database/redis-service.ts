import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
    private subscribe_conn: Redis.Redis;
    private redis: Redis.Redis;

    constructor() { 
        this.redis = new Redis();
        this.subscribe_conn = new Redis();
        this.subscribe_conn.subscribe("action:logpropres");
    }

    subscriber() {
        return this.subscribe_conn;
    }

    connection() {
        return this.redis;
    }


    
}
