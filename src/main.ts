import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as WebSocket from 'ws';
import * as querystring from 'querystring'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const options = new DocumentBuilder()
    .setTitle('Everipedia API')
    .setDescription('Data access for the Everipedia Network')
    .setVersion('0.1')
    .addTag('Proposals')
    .addTag('Plagiarism')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  const apiKey = "eyJhbGciOiJLTVNFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1NDc5MDM3NTYsImp0aSI6IjE0YzY4Yjk5LTM5NTctNDZjYi04OTBiLWVkODJiMjFjOTQ3NyIsImlhdCI6MTU0MjcxOTc1NiwiaXNzIjoiZGZ1c2UuaW8iLCJzdWIiOiJDaVFBNmNieWU1ekJJS1pJWFAxYnBZdi9oejVjcXpFRm9ySnVKUGsxZnExeDR5SGhKYUFTUEFBL0NMUnQ2TkdLT3F2V2w4cldCZVBPRDRwdGkyVWIyWllrNUxMVGhyMTViNWxBdUNUNXFvaXdjWHdsRS96NTMwdWJDZVRmK0pFSnp3SjlGdz09IiwidGllciI6ImJldGEtdjEiLCJzdGJsayI6MiwidiI6MX0.qTZ0FqT8GIfaY4xeuM-tFpTnw97Jr9r7CeZdfMRTVK8W6I8bRZGHEzRASbtsZDivlZ2c8YK22hVn70qiBuwF-Q";
  const query = querystring.stringify({ token: apiKey });

  const dfuse = new WebSocket(`wss://mainnet.eos.dfuse.io/v1/stream?${query}`, {
    headers: {
        Origin: "https://everipedia.org"
    }
  });
  dfuse.on('open', () => {
    const req = {
      type: "get_actions",
      listen: true,
      data: {
        account: "eparticlectr",
        action_name: "votebyhash",
        receiver: "eparticlectr"
      },
      start_block: 26000000  
    };
    dfuse.send(JSON.stringify(req));
  });
  dfuse.on('message', (data: Object) => {
    console.log(data);
  });
  dfuse.on('error', (e: Error) => {
    console.log(e);
  });

  await app.listen(3001);
}
bootstrap();
