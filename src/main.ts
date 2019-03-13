import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
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
    expressApp.use(cors());
    expressApp.use(morgan('combined'));

    // Automatically set the Content-Type headers for the /v1/chain routes
    // Both eosjs and cleos don't set those headers explicitly, and Nestjs
    // doesn't read in the body with the @Body function unless that header
    // is explicitly set
    expressApp.use(function(req, res, next) {
        if (req.path.startsWith('/v1/chain/')) req.headers['content-type'] = 'application/json';
        next();
    });

    const app = await NestFactory.create(AppModule, expressApp);

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
