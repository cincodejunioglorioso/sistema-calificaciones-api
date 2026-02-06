import { config } from "dotenv";
import { DataSource } from "typeorm"

const env = process.env.NODE_ENV || 'development'

config ({
    path: `.env.${env}`
});

const databaseUrl = process.env.DATABASE_URL;

export const AppDataSource = new DataSource(
    databaseUrl
        ? {
            type: 'postgres',
            url: databaseUrl,
            entities: ['dist/**/*.entity.js', 'src/**/*.entity.ts'],
            migrations: ['dist/database/migrations/*.js', 'src/database/migrations/*.ts'],
            ssl: { rejectUnauthorized: false },
          }
        : {
            type: 'postgres',
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USERNAME,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            entities: ['dist/**/*.entity.js', 'src/**/*.entity.ts'],
            migrations: ['dist/database/migrations/*.js', 'src/database/migrations/*.ts'],
          }
);