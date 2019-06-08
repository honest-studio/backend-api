import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as WebSocket from 'ws';
import * as querystring from 'querystring';
import { ConfigService } from './common';
import express from 'express';
import * as cors from 'cors';
import * as morgan from 'morgan';
import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { isIpfsRunning } from './utils';
import * as bodyParser from 'body-parser';

async function bootstrap() {
    // Check IPFS daemon status (if enabled)
    // const ipfsIsRunning = await isIpfsRunning();

    const expressApp = express();

    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
    app.use(bodyParser.json({limit: '25mb'}));
    app.use(bodyParser.urlencoded({limit: '25mb', extended: true}));
    app.enableCors();
    app.enableShutdownHooks();

    // Swagger
    const serverHost = app.get(ConfigService).get('SERVER_HOST');
    const serverHttpPort = app.get(ConfigService).get('SERVER_HTTP_PORT');
    const options = new DocumentBuilder()
        .setTitle('Everipedia API')
        .setDescription('Data access API for the Everipedia dapp on EOS')
        .setVersion('0.1')
        .setSchemes('http')
        .setHost(`${serverHost}:${serverHttpPort}`)
        .addTag('Proposals')
        .addTag('Wikis')
        .addTag('Recent Activity')
        .addTag('Chain')
        .addTag('Search')
        .addTag('Sitemap')
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

    await app
        .listen(serverHttpPort)
        .then(() => {
            console.info(
                chalk.cyan('Backend, PID') +
                    chalk.green(' [') +
                    chalk.blue(`${process.pid}`) +
                    chalk.green('] started in mode'),
                chalk.green('[') + chalk.blue(process.env.NODE_ENV) + chalk.green('] ')
            );
        })
        .catch(console.error);
}
bootstrap();
