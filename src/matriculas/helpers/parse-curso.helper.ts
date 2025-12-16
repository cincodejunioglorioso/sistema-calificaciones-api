import { NivelCurso, EspecialidadCurso } from '../../cursos/entities/curso.entity';

export class ParserCursoHelper {
  
  static parsearCurso(
    año: string, 
    paralelo: string, 
    especialidad: string
  ): {
    nivel: NivelCurso;
    paralelo: string;
    especialidad: EspecialidadCurso;
  } | null {
    const añoLimpio = año?.toString().trim().toUpperCase();
    const paraleloLimpio = paralelo?.toString().trim().toUpperCase();
    const especialidadLimpia = especialidad?.toString().trim().toUpperCase();

    if (!añoLimpio || !paraleloLimpio || !especialidadLimpia) {
      return null;
    }

    const nivel = this.mapearAñoANivel(añoLimpio);
    if (!nivel) {
      return null;
    }

    const especialidadEnum = this.mapearEspecialidad(especialidadLimpia);
    if (!especialidadEnum) {
      return null;
    }

    return {
      nivel,
      paralelo: paraleloLimpio,
      especialidad: especialidadEnum
    };
  }

  private static mapearAñoANivel(año: string): NivelCurso | null {
    const mapa: Record<string, NivelCurso> = {
      'OCTAVO': NivelCurso.OCTAVO,
      'NOVENO': NivelCurso.NOVENO,
      'DECIMO': NivelCurso.DECIMO,
      'PRIMERO': NivelCurso.PRIMERO_BACHILLERATO,
      'SEGUNDO': NivelCurso.SEGUNDO_BACHILLERATO,
      'TERCERO': NivelCurso.TERCERO_BACHILLERATO,
    };
    return mapa[año] || null;
  }

  private static mapearEspecialidad(especialidad: string): EspecialidadCurso | null {
    const mapa: Record<string, EspecialidadCurso> = {
      'BASICA': EspecialidadCurso.BASICA,
      'BÁSICA': EspecialidadCurso.BASICA,
      'CIENCIAS': EspecialidadCurso.CIENCIAS,
      'TECNICO': EspecialidadCurso.TECNICO,
      'TÉCNICO': EspecialidadCurso.TECNICO,
    };
    return mapa[especialidad] || null;
  }

  static buscarCursoEnBD(
    nivel: NivelCurso,
    paralelo: string,
    especialidad: EspecialidadCurso,
    cursosDisponibles: any[]
  ): { cursoId?: string; error?: string } {
    const cursoEncontrado = cursosDisponibles.find(c => {
      const coincide = 
        c.nivel === nivel &&
        c.paralelo === paralelo &&
        c.especialidad === especialidad;
      
      return coincide;
    });

    if (!cursoEncontrado) {
      return {
        error: `Curso no encontrado en la base de datos: ${nivel} ${paralelo} - ${especialidad}`
      };
    }

    return { cursoId: cursoEncontrado.id };
  }

  static esFilaVacia(row: any): boolean {
    const cedula = this.limpiarCedula(row['E']);
    const nombres = this.limpiarTexto(row['F']);
    const cuenta = this.limpiarCorreo(row['G']);

    return !cedula && !nombres && !cuenta;
  }

  static limpiarCedula(valor: any): string {
    if (!valor) return '';

    const limpio = String(valor).trim().toUpperCase();
    return limpio.replace(/[^A-Z0-9]/g, '');
  }
  

  static limpiarTexto(valor: any): string {
    if (!valor) return '';
    return String(valor).trim().toUpperCase();
  }

  static limpiarCorreo(valor: any): string {
    if (!valor) return '';
    return String(valor).trim().toLowerCase();
  }
}