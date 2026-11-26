<?php

namespace Database\Seeders;

use App\Enums\Origen;
use App\Enums\PrecisionFecha;
use App\Enums\Sexo;
use App\Enums\TipoElectronico;
use App\Models\Animal;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Rebaño de prueba para desarrollo: 30 animales inventados con crotales
 * consecutivos ES 0000 0000 0001 … ES 0000 0000 0030.
 *
 * - 1 a 3: carneros reproductores. 4: macho no reproductor.
 * - 5 a 14: ovejas adultas (las madres).
 * - 15 a 30: ovejas jóvenes; la mayoría con madre (5 a 14) y padre (1 a 3).
 *
 * Los datos son fijos (no aleatorios) para que el rebaño de prueba sea siempre
 * el mismo. Las fechas se calculan desde hoy para que las edades tengan sentido.
 * Si un crotal ya existe, no se vuelve a crear: se puede ejecutar varias veces.
 */
class CensoPruebaSeeder extends Seeder
{
    public const TOTAL = 30;

    public function run(): void
    {
        // Las fichas quedan a nombre del primer usuario de prueba, si existe.
        $autor = User::where('usuario', UsuariosPruebaSeeder::USUARIOS[0]['usuario'])->first();

        foreach ($this->animales() as $numero => $datos) {
            $codigo = self::codigo($numero);

            if (Animal::where('codigo_oficial', $codigo)->exists()) {
                continue;
            }

            // Madre y padre se indican por su número; aquí se buscan sus UUID.
            // Siempre tienen un número menor, así que ya están creados.
            $madreId = isset($datos['madre']) ? $this->idDe($datos['madre']) : null;
            $padreId = isset($datos['padre']) ? $this->idDe($datos['padre']) : null;

            [$fecha, $precision] = $datos['nacimiento'];

            $animal = new Animal([
                'codigo_oficial' => $codigo,
                'tipo_electronico' => $datos['tipo'],
                'nombre_o_numero' => $datos['nombre'] ?? null,
                'sexo' => $datos['sexo'],
                'reproductor' => $datos['reproductor'] ?? false,
                'raza' => $datos['raza'] ?? null,
                'fecha_nacimiento' => $fecha,
                'precision_nacimiento' => $precision,
                'origen' => $datos['origen'],
                'madre_id' => $madreId,
                'padre_id' => $padreId,
                'notas' => $datos['notas'] ?? null,
            ]);

            // La auditoría no es asignable en bloque (ver el modelo): se pone a mano.
            $animal->creado_por = $autor?->id;
            $animal->modificado_por = $autor?->id;
            $animal->save();
        }
    }

    /**
     * Código oficial de prueba a partir de su número: 7 → "ES000000000007".
     */
    public static function codigo(int $numero): string
    {
        return 'ES'.str_pad((string) $numero, 12, '0', STR_PAD_LEFT);
    }

    private function idDe(int $numero): ?string
    {
        return Animal::where('codigo_oficial', self::codigo($numero))->value('id');
    }

    /**
     * Definición del rebaño de prueba, por número de crotal.
     *
     * @return array<int, array<string, mixed>>
     */
    private function animales(): array
    {
        $h = Sexo::Hembra;
        $m = Sexo::Macho;
        $bolo = TipoElectronico::Bolo;
        $crotal = TipoElectronico::CrotalElectronico;
        $ninguno = TipoElectronico::Ninguno;
        $nacida = Origen::Nacida;
        $comprada = Origen::Comprada;

        return [
            // Carneros
            1 => ['sexo' => $m, 'reproductor' => true, 'nombre' => 'Carnero Prueba 1', 'tipo' => $bolo,
                'origen' => $comprada, 'raza' => 'Raza de prueba A', 'nacimiento' => $this->exacta(5, 2)],
            2 => ['sexo' => $m, 'reproductor' => true, 'nombre' => 'Carnero Prueba 2', 'tipo' => $crotal,
                'origen' => $comprada, 'raza' => 'Raza de prueba B', 'nacimiento' => $this->mes(4)],
            3 => ['sexo' => $m, 'reproductor' => true, 'tipo' => $bolo,
                'origen' => $nacida, 'raza' => 'Raza de prueba A', 'nacimiento' => $this->exacta(3, 5)],
            4 => ['sexo' => $m, 'nombre' => 'Macho Prueba 4', 'tipo' => $crotal,
                'origen' => $nacida, 'nacimiento' => $this->exacta(1, 3),
                'notas' => 'Animal de prueba: macho sin marcar como reproductor.'],

            // Ovejas adultas (madres)
            5 => ['sexo' => $h, 'nombre' => 'Prueba 5', 'tipo' => $bolo, 'origen' => $comprada,
                'raza' => 'Raza de prueba A', 'nacimiento' => $this->exacta(7, 1),
                'notas' => 'Nota inventada para probar cómo se ven las notas en la ficha.'],
            6 => ['sexo' => $h, 'nombre' => 'Prueba 6', 'tipo' => $crotal, 'origen' => $comprada,
                'nacimiento' => $this->anio(7)],
            7 => ['sexo' => $h, 'tipo' => $bolo, 'origen' => $comprada, 'nacimiento' => $this->desconocida()],
            8 => ['sexo' => $h, 'nombre' => 'Prueba 8', 'tipo' => $bolo, 'origen' => $nacida,
                'raza' => 'Raza de prueba B', 'nacimiento' => $this->mes(6, 4)],
            9 => ['sexo' => $h, 'tipo' => $ninguno, 'origen' => $comprada, 'nacimiento' => $this->anio(8)],
            10 => ['sexo' => $h, 'nombre' => 'Prueba 10', 'tipo' => $crotal, 'origen' => $nacida,
                'raza' => 'Raza de prueba A', 'nacimiento' => $this->exacta(5, 8)],
            11 => ['sexo' => $h, 'tipo' => $bolo, 'origen' => $nacida, 'nacimiento' => $this->exacta(5, 1)],
            12 => ['sexo' => $h, 'nombre' => 'Prueba 12', 'tipo' => $bolo, 'origen' => $nacida,
                'nacimiento' => $this->mes(4, 7)],
            13 => ['sexo' => $h, 'tipo' => $crotal, 'origen' => $comprada, 'nacimiento' => $this->desconocida()],
            14 => ['sexo' => $h, 'nombre' => 'Prueba 14', 'tipo' => $bolo, 'origen' => $nacida,
                'raza' => 'Raza de prueba B', 'nacimiento' => $this->exacta(4, 2)],

            // Ovejas jóvenes, hijas de las anteriores
            15 => ['sexo' => $h, 'nombre' => 'Prueba 15', 'tipo' => $bolo, 'origen' => $nacida,
                'madre' => 5, 'padre' => 1, 'nacimiento' => $this->exacta(3, 1)],
            16 => ['sexo' => $h, 'tipo' => $bolo, 'origen' => $nacida,
                'madre' => 5, 'padre' => 1, 'nacimiento' => $this->exacta(2, 1)],
            17 => ['sexo' => $h, 'nombre' => 'Prueba 17', 'tipo' => $crotal, 'origen' => $nacida,
                'madre' => 6, 'padre' => 2, 'nacimiento' => $this->exacta(2, 3)],
            18 => ['sexo' => $h, 'tipo' => $bolo, 'origen' => $nacida,
                'madre' => 7, 'padre' => 1, 'nacimiento' => $this->mes(2, 6)],
            19 => ['sexo' => $h, 'nombre' => 'Prueba 19', 'tipo' => $bolo, 'origen' => $nacida,
                'madre' => 8, 'padre' => 2, 'nacimiento' => $this->exacta(2, 0)],
            20 => ['sexo' => $h, 'tipo' => $crotal, 'origen' => $nacida,
                'madre' => 8, 'padre' => 3, 'nacimiento' => $this->exacta(1, 2)],
            21 => ['sexo' => $h, 'nombre' => 'Prueba 21', 'tipo' => $bolo, 'origen' => $nacida,
                'madre' => 10, 'padre' => 1, 'nacimiento' => $this->exacta(1, 5)],
            22 => ['sexo' => $h, 'tipo' => $bolo, 'origen' => $nacida,
                'madre' => 10, 'padre' => 3, 'nacimiento' => $this->exacta(0, 8)],
            23 => ['sexo' => $h, 'nombre' => 'Prueba 23', 'tipo' => $crotal, 'origen' => $nacida,
                'madre' => 11, 'padre' => 2, 'nacimiento' => $this->exacta(1, 1)],
            24 => ['sexo' => $h, 'tipo' => $bolo, 'origen' => $nacida,
                'madre' => 12, 'padre' => 3, 'nacimiento' => $this->exacta(0, 5)],
            25 => ['sexo' => $h, 'nombre' => 'Prueba 25', 'tipo' => $bolo, 'origen' => $nacida,
                'madre' => 14, 'nacimiento' => $this->exacta(1, 0)],
            26 => ['sexo' => $h, 'tipo' => $crotal, 'origen' => $nacida,
                'madre' => 9, 'nacimiento' => $this->anio(2)],

            // Ovejas jóvenes compradas, sin madre ni padre en el censo
            27 => ['sexo' => $h, 'nombre' => 'Prueba 27', 'tipo' => $bolo, 'origen' => $comprada,
                'raza' => 'Raza de prueba A', 'nacimiento' => $this->mes(2, 2)],
            28 => ['sexo' => $h, 'tipo' => $bolo, 'origen' => $comprada, 'nacimiento' => $this->anio(3)],
            29 => ['sexo' => $h, 'nombre' => 'Prueba 29', 'tipo' => $ninguno, 'origen' => $comprada,
                'nacimiento' => $this->desconocida()],
            30 => ['sexo' => $h, 'tipo' => $crotal, 'origen' => $comprada, 'nacimiento' => $this->exacta(2, 9)],
        ];
    }

    /*
     * Fechas de nacimiento con su precisión, contadas hacia atrás desde hoy.
     * Cada una devuelve [fecha 'AAAA-MM-DD' o null, PrecisionFecha], ya
     * normalizada como la guarda la API: día 1 para "mes", 1 de enero para "anio".
     */

    /** @return array{string, PrecisionFecha} */
    private function exacta(int $anios, int $meses): array
    {
        $fecha = Carbon::today()->subYears($anios)->subMonths($meses)->subDays(10);

        return [$fecha->toDateString(), PrecisionFecha::Exacta];
    }

    /** @return array{string, PrecisionFecha} */
    private function mes(int $anios, int $meses = 0): array
    {
        $fecha = Carbon::today()->subYears($anios)->subMonths($meses)->startOfMonth();

        return [$fecha->toDateString(), PrecisionFecha::Mes];
    }

    /** @return array{string, PrecisionFecha} */
    private function anio(int $anios): array
    {
        $fecha = Carbon::today()->subYears($anios)->startOfYear();

        return [$fecha->toDateString(), PrecisionFecha::Anio];
    }

    /** @return array{null, PrecisionFecha} */
    private function desconocida(): array
    {
        return [null, PrecisionFecha::Desconocida];
    }
}
