// nest-backend/src/seeds/seed.runner.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { AdminSeed } from './admin.seed';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 🔧 Cargar variables de entorno ANTES de crear la app
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';

dotenv.config({ 
  path: path.resolve(__dirname, '../../', envFile) 
});

async function runSeeds() {
  console.log('🌱 Iniciando seeds...');
  console.log(`📁 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Base de datos: ${process.env.DB_NAME}\n`);

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'], // Solo mostrar errores
  });

  const dataSource = app.get(DataSource);

  try {
    // Verificar conexión
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    // Ejecutar seed del admin
    const adminSeed = new AdminSeed();
    await adminSeed.run(dataSource);

    console.log('\n✅ Seeds completados exitosamente');
  } catch (error) {
    console.error('❌ Error ejecutando seeds:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runSeeds();