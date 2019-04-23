import { Controller, Get, Res } from '@nestjs/common';
import * as client from 'prom-client';

// adapted from https://github.com/digikare/nestjs-prom

@Controller('metrics')
export class MetricsController {

    constructor() {
        console.log('-- Metrics controller has started')
        
    }
    @Get()
    index(@Res() res) {
        res.set('Content-Type', client.register.contentType);
        res.end(client.register.metrics());
    }
}
