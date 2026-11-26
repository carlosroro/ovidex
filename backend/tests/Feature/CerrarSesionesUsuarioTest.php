<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class CerrarSesionesUsuarioTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // El resto de pruebas usan sesiones en memoria (array); el comando
        // necesita que estén en la base de datos, como en desarrollo.
        config(['session.driver' => 'database']);
    }

    /** Simula una sesión abierta en un dispositivo, como la guarda Laravel. */
    private function crearSesion(User $cuenta): void
    {
        DB::table('sessions')->insert([
            'id' => Str::random(40),
            'user_id' => $cuenta->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Navegador de prueba',
            'payload' => base64_encode(serialize([])),
            'last_activity' => now()->getTimestamp(),
        ]);
    }

    public function test_cierra_las_sesiones_y_anula_el_recordarme(): void
    {
        $cuenta = User::factory()->create(['usuario' => 'prueba1']);
        $this->crearSesion($cuenta);
        $this->crearSesion($cuenta);
        $tokenAnterior = $cuenta->remember_token;

        $this->artisan('usuarios:cerrar-sesiones', ['usuario' => 'Prueba1'])
            ->expectsOutputToContain('Se han cerrado 2 sesiones de prueba1')
            ->assertSuccessful();

        $this->assertSame(0, DB::table('sessions')->where('user_id', $cuenta->id)->count());
        $this->assertNotSame($tokenAnterior, $cuenta->fresh()->remember_token);
    }

    public function test_la_cookie_recordarme_anterior_deja_de_identificar_al_usuario(): void
    {
        $cuenta = User::factory()->create(['usuario' => 'prueba1']);
        $proveedor = Auth::guard('web')->getProvider();
        $tokenAnterior = $cuenta->remember_token;

        // Es la comprobación que hace Laravel con la cookie "recordarme"
        $this->assertNotNull($proveedor->retrieveByToken($cuenta->id, $tokenAnterior));

        $this->artisan('usuarios:cerrar-sesiones', ['usuario' => 'prueba1'])->assertSuccessful();

        $this->assertNull($proveedor->retrieveByToken($cuenta->id, $tokenAnterior));
    }

    public function test_no_afecta_a_otros_usuarios(): void
    {
        $cuenta = User::factory()->create(['usuario' => 'prueba1']);
        $otra = User::factory()->create(['usuario' => 'prueba2']);
        $this->crearSesion($cuenta);
        $this->crearSesion($otra);
        $tokenOtra = $otra->remember_token;

        $this->artisan('usuarios:cerrar-sesiones', ['usuario' => 'prueba1'])->assertSuccessful();

        $this->assertSame(1, DB::table('sessions')->where('user_id', $otra->id)->count());
        $this->assertSame($tokenOtra, $otra->fresh()->remember_token);
    }

    public function test_el_usuario_puede_volver_a_entrar_con_su_contrasena(): void
    {
        User::factory()->create(['usuario' => 'prueba1']); // contraseña de la factoría: "password"

        $this->artisan('usuarios:cerrar-sesiones', ['usuario' => 'prueba1'])->assertSuccessful();

        $this->assertTrue(Auth::attempt(['usuario' => 'prueba1', 'password' => 'password']));
    }

    public function test_un_usuario_inexistente_da_error_sin_cambiar_nada(): void
    {
        $cuenta = User::factory()->create(['usuario' => 'prueba1']);
        $this->crearSesion($cuenta);
        $tokenAnterior = $cuenta->remember_token;

        $this->artisan('usuarios:cerrar-sesiones', ['usuario' => 'noexiste'])
            ->expectsOutputToContain('No existe ningún usuario «noexiste».')
            ->assertFailed();

        $this->assertSame(1, DB::table('sessions')->count());
        $this->assertSame($tokenAnterior, $cuenta->fresh()->remember_token);
    }

    public function test_avisa_si_las_sesiones_no_estan_en_la_base_de_datos(): void
    {
        config(['session.driver' => 'file']);
        $cuenta = User::factory()->create(['usuario' => 'prueba1']);
        $tokenAnterior = $cuenta->remember_token;

        $this->artisan('usuarios:cerrar-sesiones', ['usuario' => 'prueba1'])
            ->expectsOutputToContain('no se pueden cerrar desde aquí')
            ->assertFailed();

        // El "recordarme" sí se anula
        $this->assertNotSame($tokenAnterior, $cuenta->fresh()->remember_token);
    }
}
