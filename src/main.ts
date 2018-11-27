import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as WebSocket from 'ws';
import * as querystring from 'querystring'
import * as seed from './seed';
import { SSL } from './config';
import { createServer } from 'https';
import * as express from 'express';
import { ipfs } from './ipfs.connection'; // this will auto-start an IPFS node

async function bootstrap() {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, expressApp);
  const httpsServer = createServer(SSL, expressApp);

  const options = new DocumentBuilder()
    .setTitle('Everipedia API')
    .setDescription('Data access API for the Everipedia dapp on EOS')
    .setVersion('0.1')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  seed.start();

  httpsServer.listen(3000);
  await app.listen(3001);
}
bootstrap();
