import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import chalk from 'chalk';
import express from 'express';
import { AppModule } from './app.module';
import { ConfigService } from './common';

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
        .setVersion('2.1')
        .setSchemes('https')
        .setHost('api.everipedia.org')
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
