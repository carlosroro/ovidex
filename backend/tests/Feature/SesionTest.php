<?php

namespace Tests\Feature;

use App\Http\Requests\IniciarSesionRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Testing\TestResponse;
use Symfony\Component\HttpFoundation\Cookie;
use Tests\Soporte\ValidarCsrfEnPruebas;
use Tests\TestCase;

class SesionTest extends TestCase
{
    use RefreshDatabase;

    /** Dirección del frontend en desarrollo (servidor de Vite). */
    private const FRONTEND = 'http://localhost:5173';

    private User $cuenta;

    protected function setUp(): void
    {
        parent::setUp();

        // Contraseña de la factoría: "password"
        $this->cuenta = User::factory()->create(['nombre' => 'Usuario de Prueba', 'usuario' => 'prueba1']);

        // Todas las peticiones simulan venir del frontend, como en la app real;
        // si no, Sanctum no usa la sesión.
        $this->withHeaders(['Referer' => self::FRONTEND.'/', 'Origin' => self::FRONTEND]);
    }

    private function login(string $usuario = 'prueba1', string $password = 'password', bool $recordar = false): TestResponse
    {
        return $this->postJson('/api/login', compact('usuario', 'password', 'recordar'));
    }

    /**
     * En las pruebas, la app (y con ella el usuario identificado) se mantiene
     * entre peticiones. Esto la "olvida", como si llegara una petición nueva
     * desde un móvil que solo tiene sus cookies.
     */
    private function olvidarUsuario(): void
    {
        $this->app['auth']->forgetGuards();
    }

    private function nombreCookieRecordarme(): string
    {
        return Auth::guard('web')->getRecallerName();
    }

    /**
     * Prepara la siguiente petición con la cookie indicada, como haría el
     * navegador. (Las peticiones JSON de prueba solo envían cookies con
     * withCredentials()).
     */
    private function conCookie(Cookie $cookie): static
    {
        return $this->withCredentials()->withCookie($cookie->getName(), $cookie->getValue());
    }

    // --- Inicio de sesión ---

    public function test_login_correcto_devuelve_el_usuario_y_queda_autenticado(): void
    {
        $this->login()
            ->assertOk()
            ->assertExactJson([
                'id' => $this->cuenta->id,
                'nombre' => 'Usuario de Prueba',
                'usuario' => 'prueba1',
            ]);

        $this->assertAuthenticatedAs($this->cuenta);
    }

    public function test_el_usuario_se_compara_sin_mayusculas_ni_espacios(): void
    {
        $this->login('  PRUEBA1 ')->assertOk();

        $this->assertAuthenticatedAs($this->cuenta);
    }

    public function test_contrasena_incorrecta_y_usuario_inexistente_responden_igual(): void
    {
        $passwordMal = $this->login('prueba1', 'incorrecta');
        $usuarioMal = $this->login('noexiste', 'password');

        foreach ([$passwordMal, $usuarioMal] as $respuesta) {
            $respuesta->assertStatus(422)
                ->assertJsonPath('message', IniciarSesionRequest::MENSAJE_CREDENCIALES);
        }
        $this->assertSame($passwordMal->json(), $usuarioMal->json());
        $this->assertGuest();
    }

    public function test_campos_vacios_dan_422_sin_iniciar_sesion(): void
    {
        $this->postJson('/api/login', ['usuario' => '', 'password' => ''])
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'usuario' => 'Escribe tu usuario.',
                'password' => 'Escribe tu contraseña.',
            ]);

        $this->assertGuest();
    }

    public function test_con_recordar_se_crea_la_cookie_recordarme_de_365_dias(): void
    {
        $respuesta = $this->login(recordar: true)->assertOk();

        $respuesta->assertCookie($this->nombreCookieRecordarme());
        $cookie = $respuesta->getCookie($this->nombreCookieRecordarme());
        $this->assertEqualsWithDelta(now()->addDays(365)->getTimestamp(), $cookie->getExpiresTime(), 60);
    }

    public function test_sin_recordar_no_se_crea_la_cookie_recordarme(): void
    {
        $this->login(recordar: false)
            ->assertOk()
            ->assertCookieMissing($this->nombreCookieRecordarme());
    }

    public function test_la_respuesta_no_incluye_datos_sensibles(): void
    {
        $json = $this->login(recordar: true)->getContent();

        $this->assertStringNotContainsString('password', $json);
        $this->assertStringNotContainsString('remember_token', $json);
        $this->assertStringNotContainsString($this->cuenta->fresh()->remember_token, $json);
    }

    public function test_si_caduca_la_sesion_normal_la_cookie_recordarme_mantiene_la_sesion(): void
    {
        $cookie = $this->login(recordar: true)->getCookie($this->nombreCookieRecordarme());

        // Nueva petición sin sesión (caducada), solo con la cookie "recordarme"
        $this->olvidarUsuario();
        $this->flushSession();

        $this->conCookie($cookie)
            ->getJson('/api/usuario')
            ->assertOk()
            ->assertJsonPath('usuario', 'prueba1');
    }

    public function test_tras_cerrar_sesiones_con_el_comando_la_cookie_recordarme_no_sirve(): void
    {
        // El comando necesita las sesiones en la base de datos, como en desarrollo
        config(['session.driver' => 'database']);

        $cookie = $this->login(recordar: true)->getCookie($this->nombreCookieRecordarme());

        $this->artisan('usuarios:cerrar-sesiones', ['usuario' => 'prueba1'])->assertSuccessful();

        $this->olvidarUsuario();
        $this->flushSession();

        $this->conCookie($cookie)
            ->getJson('/api/usuario')
            ->assertUnauthorized();
    }

    // --- Límite de intentos ---

    public function test_el_sexto_intento_da_429_aunque_la_contrasena_sea_correcta(): void
    {
        for ($i = 1; $i <= IniciarSesionRequest::MAX_INTENTOS; $i++) {
            $this->login('prueba1', 'incorrecta')->assertStatus(422);
        }

        $this->login('prueba1', 'password')
            ->assertStatus(429)
            ->assertHeader('Retry-After')
            ->assertJsonPath('message', fn (string $mensaje) => str_starts_with($mensaje, 'Demasiados intentos. Vuelve a intentarlo en '));

        $this->assertGuest();
    }

    public function test_pasado_el_tiempo_de_espera_se_puede_volver_a_intentar(): void
    {
        for ($i = 1; $i <= IniciarSesionRequest::MAX_INTENTOS; $i++) {
            $this->login('prueba1', 'incorrecta');
        }
        $this->login()->assertStatus(429);

        $this->travel(IniciarSesionRequest::SEGUNDOS_BLOQUEO + 1)->seconds();

        $this->login()->assertOk();
    }

    public function test_un_acierto_reinicia_el_contador(): void
    {
        for ($i = 1; $i < IniciarSesionRequest::MAX_INTENTOS; $i++) {
            $this->login('prueba1', 'incorrecta')->assertStatus(422);
        }
        $this->login()->assertOk();
        $this->postJson('/api/logout')->assertNoContent();
        $this->olvidarUsuario();

        // Si el contador no se hubiera reiniciado, alguno de estos daría 429
        for ($i = 1; $i <= IniciarSesionRequest::MAX_INTENTOS; $i++) {
            $this->login('prueba1', 'incorrecta')->assertStatus(422);
        }
    }

    public function test_el_limite_de_un_usuario_no_bloquea_a_otro(): void
    {
        User::factory()->create(['usuario' => 'prueba2']);

        for ($i = 1; $i <= IniciarSesionRequest::MAX_INTENTOS; $i++) {
            $this->login('prueba1', 'incorrecta');
        }
        $this->login('prueba1')->assertStatus(429);

        $this->login('prueba2')->assertOk()->assertJsonPath('usuario', 'prueba2');
    }

    // --- Rutas protegidas y cierre de sesión ---

    public function test_usuario_actual_con_sesion(): void
    {
        $this->login();

        $this->getJson('/api/usuario')
            ->assertOk()
            ->assertExactJson(['id' => $this->cuenta->id, 'nombre' => 'Usuario de Prueba', 'usuario' => 'prueba1']);
    }

    public function test_usuario_actual_sin_sesion_da_401(): void
    {
        $this->getJson('/api/usuario')->assertUnauthorized();
    }

    public function test_cerrar_sesion_da_204_y_despues_401(): void
    {
        $cookie = $this->login(recordar: true)->getCookie($this->nombreCookieRecordarme());

        $tokenAnterior = $this->cuenta->fresh()->remember_token;
        $this->conCookie($cookie)
            ->postJson('/api/logout')
            ->assertNoContent()
            // Se pide al navegador que borre la cookie "recordarme"
            ->assertCookieExpired($this->nombreCookieRecordarme());

        // Se mira el guard "web" (el de la sesión): durante la petición,
        // auth:sanctum cambia el guard por defecto a "sanctum", que guarda
        // en memoria el usuario que encontró al empezar.
        $this->assertGuest('web');
        $this->assertNotSame($tokenAnterior, $this->cuenta->fresh()->remember_token);

        // Petición nueva que, además, intenta usar la cookie "recordarme" antigua
        $this->olvidarUsuario();
        $this->conCookie($cookie)->getJson('/api/usuario')->assertUnauthorized();
    }

    public function test_cerrar_sesion_sin_sesion_da_401(): void
    {
        $this->postJson('/api/logout')->assertUnauthorized();
    }

    public function test_el_estado_de_la_conexion_sigue_siendo_publico(): void
    {
        $this->getJson('/api/estado')->assertOk();
    }

    // --- CSRF ---

    public function test_login_desde_otro_sitio_sin_token_csrf_da_419(): void
    {
        config(['sanctum.middleware.validate_csrf_token' => ValidarCsrfEnPruebas::class]);

        $this->withHeaders([
            'Origin' => 'https://otro-sitio.example',
            'Referer' => 'https://otro-sitio.example/',
            'Sec-Fetch-Site' => 'cross-site',
        ])->login()->assertStatus(419);

        $this->assertGuest();
    }

    public function test_login_del_frontend_sin_token_ni_mismo_origen_da_419(): void
    {
        config(['sanctum.middleware.validate_csrf_token' => ValidarCsrfEnPruebas::class]);

        // Dice venir del frontend, pero sin token ni Sec-Fetch-Site: same-origin
        $this->login()->assertStatus(419);

        $this->assertGuest();
    }

    public function test_login_del_frontend_con_token_csrf_entra(): void
    {
        config(['sanctum.middleware.validate_csrf_token' => ValidarCsrfEnPruebas::class]);

        // Como hace el frontend: primero pide la cookie y luego envía el token
        $this->get('/api/sanctum/csrf-cookie')->assertNoContent();

        $this->withHeader('X-CSRF-TOKEN', session()->token())
            ->login()
            ->assertOk();

        $this->assertAuthenticatedAs($this->cuenta);
    }
}
