<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

/**
 * Crea dos usuarios de prueba, claramente inventados, para desarrollo.
 * La contraseña sale de SEEDER_PASSWORD (backend/.env): nunca se escribe en el código.
 */
class UsuariosPruebaSeeder extends Seeder
{
    public const USUARIOS = [
        ['usuario' => 'prueba1', 'nombre' => 'Usuario de Prueba Uno'],
        ['usuario' => 'prueba2', 'nombre' => 'Usuario de Prueba Dos'],
    ];

    public function run(): void
    {
        $password = config('ovidex.seeder_password');

        // Se comprueba antes de crear nada, para no dejar la mitad de los usuarios
        if (blank($password)) {
            throw new RuntimeException(
                'Falta la variable SEEDER_PASSWORD. Defínela en backend/.env con la contraseña '
                .'que quieras para los usuarios de prueba y vuelve a ejecutar el seeder.'
            );
        }

        foreach (self::USUARIOS as $datos) {
            // updateOrCreate: si el usuario ya existe, lo actualiza en vez de fallar,
            // así se puede ejecutar el seeder varias veces.
            User::updateOrCreate(
                ['usuario' => $datos['usuario']],
                ['nombre' => $datos['nombre'], 'password' => $password],
            );
        }
    }
}
