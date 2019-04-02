import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as WebSocket from 'ws';
import * as querystring from 'querystring';
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

    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

    // Swagger
    const serverConfig = app.get(ConfigService).get('serverConfig');
    const primaryPort = serverConfig.serverHost == 'https' ? serverConfig.serverHttpsPort : serverConfig.serverHttpPort;
    const protocol = serverConfig.serverHost == 'https' ? 'https' : 'http';
    const options = new DocumentBuilder()
        .setTitle('Everipedia API')
        .setDescription('Data access API for the Everipedia dapp on EOS')
        .setVersion('0.1')
        .setSchemes(protocol)
        .setHost(`${serverConfig.serverHost}:${primaryPort}`)
        .addTag('Proposals')
        .addTag('Wikis')
        .addTag('Recent Activity')
        .addTag('Chain')
        .addTag('Search')
        .addTag('History')
        .addTag('Diffs')
        .addTag('Preview')
        .addTag('User')
        .addTag('Cache')
        .addTag('Stats')
        .addTag('OAuth')
        .addTag('Contact Us')
        .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('docs', app, document);

    // Connect to MongoDB
    await app.get('MongoDbService').connect();

    // Start Dfuse sync
    app.get('EosSyncService').sync();

    // try to load SSL config
    const sslConfig = TryResolveSslConfig(app.get(ConfigService).get('sslConfig'));
    if (sslConfig) {
        const httpsServer = createServer(sslConfig, expressApp);
        httpsServer.listen(serverConfig.serverHttpsPort);
    }

    await app.listen(serverConfig.serverHttpPort);
}
bootstrap();
