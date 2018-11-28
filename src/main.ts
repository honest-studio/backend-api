import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as WebSocket from 'ws';
import * as querystring from 'querystring'
import * as seed from './seed';
import { SSL } from './config';
import { createServer } from 'https';
import * as express from 'express';
import { ipfsNode } from './ipfs.connection'; // this will auto-start an IPFS node
import * as cors from 'cors';
import * as morgan from 'morgan';

async function bootstrap() {
  const expressApp = express();
  expressApp.use(cors())
  expressApp.use(morgan('combined'))

  const app = await NestFactory.create(AppModule, expressApp);
  const httpsServer = createServer(SSL, expressApp);

  const options = new DocumentBuilder()
    .setTitle('Everipedia API')
    .setDescription('Data access API for the Everipedia dapp on EOS')
    .setVersion('0.1')
    .setSchemes('https')
    .setHost('api.everipedia.org:3000')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  seed.start();

  httpsServer.listen(3000);
  await app.listen(3001);
}
bootstrap();
