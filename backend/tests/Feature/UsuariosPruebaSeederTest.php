<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\UsuariosPruebaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Tests\TestCase;

class UsuariosPruebaSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_crea_los_dos_usuarios_de_prueba_con_la_contrasena_de_la_variable(): void
    {
        config(['ovidex.seeder_password' => 'clave-de-prueba']);

        $this->seed(UsuariosPruebaSeeder::class);

        $this->assertEqualsCanonicalizing(['prueba1', 'prueba2'], User::pluck('usuario')->all());
        User::all()->each(fn (User $cuenta) => $this->assertTrue(Hash::check('clave-de-prueba', $cuenta->password)));
    }

    public function test_se_puede_ejecutar_dos_veces_sin_duplicar_usuarios(): void
    {
        config(['ovidex.seeder_password' => 'clave-de-prueba']);

        $this->seed(UsuariosPruebaSeeder::class);
        $this->seed(UsuariosPruebaSeeder::class);

        $this->assertSame(2, User::count());
    }

    public function test_sin_la_variable_se_detiene_con_un_mensaje_y_no_crea_nada(): void
    {
        foreach ([null, ''] as $valor) {
            config(['ovidex.seeder_password' => $valor]);

            try {
                $this->seed(UsuariosPruebaSeeder::class);
                $this->fail('El seeder debería haberse detenido.');
            } catch (RuntimeException $error) {
                $this->assertStringContainsString('SEEDER_PASSWORD', $error->getMessage());
                $this->assertStringContainsString('backend/.env', $error->getMessage());
            }
        }

        $this->assertSame(0, User::count());
    }
}
