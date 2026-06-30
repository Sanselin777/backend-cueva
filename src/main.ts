import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)

  // Reject unknown properties and auto-coerce types at the API boundary
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // Allow calls from the Next.js dev server
  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3001' })

  // Uncomment if a global route prefix is needed: app.setGlobalPrefix('api')

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Cueva API')
    .setDescription('Backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup('api-docs', app, SwaggerModule.createDocument(app, swaggerConfig))

  const port = process.env.PORT ?? 3000
  await app.listen(port)
  console.log(`Backend running on http://localhost:${port}`)
  console.log(`Swagger docs at http://localhost:${port}/api-docs`)
}
void bootstrap()
