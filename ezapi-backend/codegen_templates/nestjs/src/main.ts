import { NestFactory } from '@nestjs/core';
import { PROJECTNAMEModule } from './modules/PROJECTNAME/PROJECTNAME.module';

async function bootstrap() {
  const app = await NestFactory.create(PROJECTNAMEModule);
  await app.listen(3000);
}
bootstrap();