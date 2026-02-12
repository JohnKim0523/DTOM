import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const databaseUrl = configService.get('DATABASE_URL') || configService.get('MYSQL_URL');

  if (databaseUrl) {
    return {
      type: 'mysql',
      url: databaseUrl,
      autoLoadEntities: true,
      synchronize: true,
    };
  }

  return {
    type: 'mysql',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 3306),
    username: configService.get('DB_USERNAME', 'root'),
    password: configService.get('DB_PASSWORD', ''),
    database: configService.get('DB_DATABASE', 'dtom'),
    autoLoadEntities: true,
    synchronize: true,
  };
};
