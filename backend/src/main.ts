import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'https://localhost:3000'],
    credentials: true,
  })
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }))
  
  await app.listen(3001)
  console.log('Backend server running on http://localhost:3001')
}

bootstrap()