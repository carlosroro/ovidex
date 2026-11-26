<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Usuarios inventados para las pruebas.
 *
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * Hash de la contraseña de prueba, calculado una sola vez (es lento).
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombre' => fake()->name(),
            // Formato válido de usuario: minúsculas, números, punto, guion y guion bajo.
            'usuario' => fake()->unique()->regexify('prueba_[a-z0-9]{8}'),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }
}
