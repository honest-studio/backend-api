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

  const apiKey = "eyJhbGciOiJLTVNFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1NDQ2NzcwNTksImp0aSI6IjUyNjZkZmY3LTFlZTctNDZjYS1hNjBlLTQyNzgwZGVkODJmYiIsImlhdCI6MTU0MjA4NTA1OSwiaXNzIjoiZGZ1c2UuaW8iLCJzdWIiOiJDaVFBNmNieWUzRVlzZVErNHp5ZHFrZCttUW0vT1RxR210TTJaMWtQV1hQWnI0azlWN2tTUEFBL0NMUnRkMWN1VVEzRnhxbUFnS3FIYk1NdThKbXhvYS9zejExdEJZZnZwOGZPeW13MDJjUzd3MDJMUDliK0FnUkEzbzh6Q3lJT21GLzdKZz09IiwidGllciI6ImJldGEtdjEiLCJ2IjoxfQ.bauyJ33U9r6qlN6IyLghEV19nZ2LrlzNWpCe0FtaRXQPgxdo7cB_9jT0NBDYPJtJCscLgK_Nu9-xa3MVYU03Yg";
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
