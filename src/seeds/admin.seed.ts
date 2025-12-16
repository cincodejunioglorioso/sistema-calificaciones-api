// nest-backend/src/seeds/admin.seed.ts
import { DataSource } from 'typeorm';
import { Usuario, Role, Estado } from '../usuarios/entities/usuario.entity';
import { Docente, NivelAsignado } from '../docentes/entities/docente.entity';
import * as bcrypt from 'bcrypt';

export class AdminSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const usuarioRepository = dataSource.getRepository(Usuario);
    const docenteRepository = dataSource.getRepository(Docente);

    // Email del admin (puedes cambiarlo por variable de entorno)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin5dejunio@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

    // Verificar si ya existe el admin
    const adminExistente = await usuarioRepository.findOne({
      where: { email: adminEmail }
    });

    if (adminExistente) {
      console.log('✅ Usuario admin ya existe. Saltando seed...');
      return;
    }

    console.log('🌱 Creando usuario administrador inicial...');

    // Usar transacción para garantizar integridad
    await dataSource.transaction(async (manager) => {
      // Crear usuario admin
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const usuario = manager.create(Usuario, {
        email: adminEmail,
        password_hash: hashedPassword,
        rol: Role.ADMIN,
        estado: Estado.ACTIVO
      });

      await manager.save(usuario);
    });

    console.log('✅ Usuario administrador creado exitosamente');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    console.log('   Endpoint: PATCH /usuarios/cambiar-password');
  }
}