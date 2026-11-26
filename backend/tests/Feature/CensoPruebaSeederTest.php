<?php

namespace Tests\Feature;

use App\Enums\EstadoAnimal;
use App\Enums\PrecisionFecha;
use App\Enums\Sexo;
use App\Models\Animal;
use App\Models\User;
use Database\Seeders\CensoPruebaSeeder;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\UsuariosPruebaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CensoPruebaSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_crea_el_rebano_de_prueba_con_crotales_consecutivos(): void
    {
        $this->seed(CensoPruebaSeeder::class);

        $this->assertSame(CensoPruebaSeeder::TOTAL, Animal::count());
        $this->assertSame(
            ['ES000000000001', 'ES000000000002', 'ES000000000030'],
            Animal::whereIn('codigo_oficial', ['ES000000000001', 'ES000000000002', 'ES000000000030'])
                ->orderBy('codigo_oficial')->pluck('codigo_oficial')->all(),
        );
        // Todos activos: las bajas son otro cambio.
        $this->assertSame(0, Animal::where('estado', '!=', EstadoAnimal::Activa)->count());
    }

    public function test_incluye_carneros_reproductores_y_solo_machos_lo_son(): void
    {
        $this->seed(CensoPruebaSeeder::class);

        $reproductores = Animal::where('reproductor', true)->get();

        $this->assertGreaterThanOrEqual(1, $reproductores->count());
        $reproductores->each(fn (Animal $animal) => $this->assertSame(Sexo::Macho, $animal->sexo));
    }

    public function test_las_madres_son_hembras_y_los_padres_machos(): void
    {
        $this->seed(CensoPruebaSeeder::class);

        $conMadreYPadre = Animal::whereNotNull('madre_id')->whereNotNull('padre_id')->with('madre', 'padre')->get();
        $this->assertGreaterThanOrEqual(1, $conMadreYPadre->count());

        Animal::with('madre', 'padre')->get()->each(function (Animal $animal) {
            if ($animal->madre) {
                $this->assertSame(Sexo::Hembra, $animal->madre->sexo, "Madre de {$animal->codigo_oficial}");
                $this->assertNotSame($animal->id, $animal->madre_id);
            }
            if ($animal->padre) {
                $this->assertSame(Sexo::Macho, $animal->padre->sexo, "Padre de {$animal->codigo_oficial}");
                $this->assertNotSame($animal->id, $animal->padre_id);
            }
        });
    }

    public function test_las_fechas_son_coherentes_con_su_precision(): void
    {
        $this->seed(CensoPruebaSeeder::class);

        $animales = Animal::all();

        // Están representadas las cuatro precisiones…
        $this->assertEqualsCanonicalizing(
            PrecisionFecha::cases(),
            $animales->pluck('precision_nacimiento')->unique()->values()->all(),
        );

        // …y cada fecha cumple su regla.
        $animales->each(function (Animal $animal) {
            $fecha = $animal->fecha_nacimiento;

            match ($animal->precision_nacimiento) {
                PrecisionFecha::Desconocida => $this->assertNull($fecha),
                PrecisionFecha::Mes => $this->assertSame(1, $fecha->day),
                PrecisionFecha::Anio => $this->assertSame('01-01', $fecha->format('m-d')),
                PrecisionFecha::Exacta => $this->assertNotNull($fecha),
            };

            if ($fecha) {
                $this->assertTrue($fecha->lte(today()), "Fecha futura en {$animal->codigo_oficial}");
            }
        });
    }

    public function test_las_fichas_quedan_a_nombre_del_primer_usuario_de_prueba(): void
    {
        $autor = User::factory()->create(['usuario' => UsuariosPruebaSeeder::USUARIOS[0]['usuario']]);

        $this->seed(CensoPruebaSeeder::class);

        $this->assertSame(CensoPruebaSeeder::TOTAL, Animal::where('creado_por', $autor->id)->count());
        $this->assertSame(CensoPruebaSeeder::TOTAL, Animal::where('modificado_por', $autor->id)->count());
    }

    public function test_sin_usuarios_de_prueba_crea_los_animales_sin_autor(): void
    {
        $this->seed(CensoPruebaSeeder::class);

        $this->assertSame(CensoPruebaSeeder::TOTAL, Animal::whereNull('creado_por')->count());
    }

    public function test_se_puede_ejecutar_dos_veces_sin_duplicar_animales(): void
    {
        $this->seed(CensoPruebaSeeder::class);
        $this->seed(CensoPruebaSeeder::class);

        $this->assertSame(CensoPruebaSeeder::TOTAL, Animal::count());
    }

    public function test_database_seeder_crea_el_censo_en_desarrollo(): void
    {
        config(['ovidex.seeder_password' => 'clave-de-prueba']);

        $this->seed(DatabaseSeeder::class);

        $this->assertSame(CensoPruebaSeeder::TOTAL, Animal::count());
    }

    public function test_database_seeder_no_crea_animales_en_el_entorno_de_uso(): void
    {
        $this->app['env'] = 'production';

        // En producción db:seed pide confirmación; --force la da por respondida.
        $this->artisan('db:seed', ['--class' => DatabaseSeeder::class, '--force' => true])->assertSuccessful();

        $this->assertSame(0, Animal::count());
    }
}
