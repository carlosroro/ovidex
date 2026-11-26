<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class CrearUsuarioTest extends TestCase
{
    use RefreshDatabase;

    public function test_crea_una_cuenta_valida_con_hash_y_usuario_en_minusculas(): void
    {
        $this->artisan('usuarios:crear')
            ->expectsQuestion('Nombre', 'Usuario de Prueba')
            ->expectsQuestion('Usuario', '  Prueba.Uno ')
            ->expectsQuestion('Contraseña', 'clave-de-prueba')
            ->expectsQuestion('Repite la contraseña', 'clave-de-prueba')
            ->expectsOutputToContain('Cuenta creada: Usuario de Prueba (prueba.uno).')
            ->doesntExpectOutputToContain('clave-de-prueba')
            ->assertSuccessful();

        $cuenta = User::sole();
        $this->assertSame('Usuario de Prueba', $cuenta->nombre);
        $this->assertSame('prueba.uno', $cuenta->usuario);
        $this->assertTrue(Str::isUuid($cuenta->id));
        $this->assertNotSame('clave-de-prueba', $cuenta->getAttributes()['password']);
        $this->assertTrue(Hash::check('clave-de-prueba', $cuenta->password));
    }

    /*
     * Nota: fuera de las pruebas, si un dato no es válido el comando muestra
     * el error y lo vuelve a preguntar. Dentro de las pruebas, Laravel no
     * repite la pregunta (para no quedarse en un bucle): muestra el error y
     * detiene el comando. Por eso estas pruebas comprueban el mensaje, que el
     * comando termina con fallo y que no se crea ninguna cuenta.
     */

    public function test_rechaza_un_usuario_repetido(): void
    {
        User::factory()->create(['usuario' => 'prueba1']);

        $this->artisan('usuarios:crear')
            ->expectsQuestion('Nombre', 'Usuario de Prueba')
            ->expectsQuestion('Usuario', 'PRUEBA1')
            ->expectsOutputToContain('Ese usuario ya está en uso.')
            ->assertFailed();

        $this->assertSame(1, User::count());
    }

    public function test_rechaza_un_formato_de_usuario_no_valido(): void
    {
        // Con espacio, con tilde, demasiado corto, demasiado largo y con un símbolo no permitido
        foreach (['prueba uno', 'pruébá', 'ab', str_repeat('a', 31), 'prueba@1'] as $noValido) {
            $this->artisan('usuarios:crear')
                ->expectsQuestion('Nombre', 'Usuario de Prueba')
                ->expectsQuestion('Usuario', $noValido)
                ->expectsOutputToContain('El usuario debe tener entre 3 y 30 caracteres')
                ->assertFailed();
        }

        $this->assertSame(0, User::count());
    }

    public function test_rechaza_una_contrasena_corta(): void
    {
        $this->artisan('usuarios:crear')
            ->expectsQuestion('Nombre', 'Usuario de Prueba')
            ->expectsQuestion('Usuario', 'prueba1')
            ->expectsQuestion('Contraseña', 'corta')
            ->expectsOutputToContain('La contraseña debe tener al menos 8 caracteres.')
            ->assertFailed();

        $this->assertSame(0, User::count());
    }

    public function test_vuelve_a_pedir_las_dos_contrasenas_si_no_coinciden(): void
    {
        $this->artisan('usuarios:crear')
            ->expectsQuestion('Nombre', 'Usuario de Prueba')
            ->expectsQuestion('Usuario', 'prueba1')
            ->expectsQuestion('Contraseña', 'clave-de-prueba')
            ->expectsQuestion('Repite la contraseña', 'otra-clave-distinta')
            ->expectsOutputToContain('Las contraseñas no coinciden.')
            ->expectsQuestion('Contraseña', 'clave-buena-1')
            ->expectsQuestion('Repite la contraseña', 'clave-buena-1')
            ->assertSuccessful();

        $cuenta = User::sole();
        $this->assertTrue(Hash::check('clave-buena-1', $cuenta->password));
        $this->assertFalse(Hash::check('clave-de-prueba', $cuenta->password));
    }
}
