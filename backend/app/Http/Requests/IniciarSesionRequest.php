<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Datos del formulario de login y comprobación de las credenciales,
 * con límite de intentos fallidos.
 */
class IniciarSesionRequest extends FormRequest
{
    /** Intentos fallidos permitidos antes de bloquear… */
    public const MAX_INTENTOS = 5;

    /** …durante este tiempo (segundos). */
    public const SEGUNDOS_BLOQUEO = 60;

    /** El mismo mensaje si falla el usuario o la contraseña: no da pistas. */
    public const MENSAJE_CREDENCIALES = 'Usuario o contraseña incorrectos.';

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'usuario' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
            'recordar' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'usuario.required' => 'Escribe tu usuario.',
            'password.required' => 'Escribe tu contraseña.',
        ];
    }

    /**
     * Comprueba las credenciales e inicia sesión.
     *
     * @throws ValidationException si las credenciales no son válidas (422)
     * @throws HttpResponseException si se han superado los intentos (429)
     */
    public function autenticar(): void
    {
        $this->comprobarLimiteDeIntentos();

        $credenciales = [
            'usuario' => Str::lower(trim($this->string('usuario'))),
            'password' => $this->string('password')->toString(),
        ];

        // El segundo parámetro es "recordarme": crea la cookie de larga duración
        if (! Auth::guard('web')->attempt($credenciales, $this->boolean('recordar'))) {
            RateLimiter::hit($this->claveLimite(), self::SEGUNDOS_BLOQUEO);

            throw ValidationException::withMessages([
                'usuario' => self::MENSAJE_CREDENCIALES,
            ]);
        }

        // Un acierto pone el contador a cero
        RateLimiter::clear($this->claveLimite());
    }

    /**
     * Si ya se han superado los intentos, responde 429 sin comprobar las
     * credenciales (así no se puede seguir probando contraseñas).
     */
    private function comprobarLimiteDeIntentos(): void
    {
        if (! RateLimiter::tooManyAttempts($this->claveLimite(), self::MAX_INTENTOS)) {
            return;
        }

        $segundos = RateLimiter::availableIn($this->claveLimite());
        $texto = $segundos === 1 ? '1 segundo' : "{$segundos} segundos";

        throw new HttpResponseException(response()->json(
            ['message' => "Demasiados intentos. Vuelve a intentarlo en {$texto}."],
            429,
            ['Retry-After' => $segundos],
        ));
    }

    /**
     * Clave del contador: usuario + IP. Así, quien prueba contraseñas desde
     * un dispositivo no bloquea a la otra persona ni al mismo usuario en otro.
     */
    private function claveLimite(): string
    {
        return 'login|'.Str::transliterate(Str::lower(trim($this->string('usuario')))).'|'.$this->ip();
    }
}
