<?php

namespace Tests\Soporte;

use App\Models\User;

/**
 * Para pruebas de rutas protegidas: las peticiones simulan venir del
 * frontend (si no, Sanctum no usa la sesión) y se puede entrar como un
 * usuario sin pasar por el login.
 */
trait PeticionesDelFrontend
{
    /** Dirección del frontend en desarrollo (servidor de Vite). */
    protected const FRONTEND = 'http://localhost:5173';

    protected function comoFrontend(): static
    {
        return $this->withHeaders(['Referer' => self::FRONTEND.'/', 'Origin' => self::FRONTEND]);
    }

    /**
     * Inicia sesión con el usuario indicado (o uno nuevo) y lo devuelve.
     */
    protected function entrar(?User $usuario = null): User
    {
        $usuario ??= User::factory()->create();
        $this->comoFrontend()->actingAs($usuario);

        return $usuario;
    }
}
