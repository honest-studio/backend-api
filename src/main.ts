import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as WebSocket from 'ws';
import * as querystring from 'querystring';
import * as seed from './seed';
import { ConfigService } from './common';
import { createServer } from 'https';
import * as express from 'express';
import * as cors from 'cors';
import * as morgan from 'morgan';
import { exec } from 'child_process';
import { promisify } from 'util';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { isIpfsRunning, TryResolveSslConfig } from './utils';

async function bootstrap() {
    // Check IPFS daemon status (if enabled)
    // const ipfsIsRunning = await isIpfsRunning();

    const expressApp = express();
    expressApp.use(cors());
    expressApp.use(morgan('combined'));

    const app = await NestFactory.create(AppModule, expressApp);

    const options = new DocumentBuilder()
        .setTitle('Everipedia API')
        .setDescription('Data access API for the Everipedia dapp on EOS')
        .setVersion('0.1')
        .setSchemes('https')
        .setHost('api.everipedia.org:3000')
        .addTag('Proposals')
        .addTag('Wikis')
        .addTag('Recent Activity')
        .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('docs', app, document);

    // seed.start();

    // try to load SSL config
    const sslConfig = TryResolveSslConfig(app.get(ConfigService).get('sslConfig'));
    if (sslConfig) {
        const httpsServer = createServer(sslConfig, expressApp);
        httpsServer.listen(3000);
    }

    await app.listen(3001);
}
bootstrap();
