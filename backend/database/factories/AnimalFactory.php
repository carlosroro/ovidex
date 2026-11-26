<?php

namespace Database\Factories;

use App\Enums\EstadoAnimal;
use App\Enums\Origen;
use App\Enums\PrecisionFecha;
use App\Enums\Sexo;
use App\Enums\TipoElectronico;
use App\Models\Animal;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Animales inventados para las pruebas automáticas.
 *
 * Por defecto crea una hembra activa con fecha de nacimiento exacta.
 * Los "estados" (macho, reproductor, deBaja, fechaDesconocida) cambian
 * solo lo necesario, y se pueden combinar:
 *   Animal::factory()->reproductor()->deBaja()->create()
 *
 * @extends Factory<Animal>
 */
class AnimalFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // Crotales claramente de prueba: ES 0000 9xxx xxxx. Empiezan por
            // "ES00009" para no coincidir con los del seeder (ES0000000000NN).
            'codigo_oficial' => 'ES00009'.fake()->unique()->numerify('#######'),
            'tipo_electronico' => fake()->randomElement(TipoElectronico::cases()),
            'nombre_o_numero' => fake()->optional()->numerify('Prueba ###'),
            'sexo' => Sexo::Hembra,
            'reproductor' => false,
            'raza' => null,
            'fecha_nacimiento' => fake()->dateTimeBetween('-8 years', '-1 year')->format('Y-m-d'),
            'precision_nacimiento' => PrecisionFecha::Exacta,
            'origen' => Origen::Nacida,
            'estado' => EstadoAnimal::Activa,
            'notas' => null,
        ];
    }

    /**
     * Macho no reproductor.
     */
    public function macho(): static
    {
        return $this->state(fn () => [
            'sexo' => Sexo::Macho,
            'reproductor' => false,
        ]);
    }

    /**
     * Carnero reproductor (macho marcado como reproductor).
     */
    public function reproductor(): static
    {
        return $this->state(fn () => [
            'sexo' => Sexo::Macho,
            'reproductor' => true,
        ]);
    }

    /**
     * Animal dado de baja.
     */
    public function deBaja(): static
    {
        return $this->state(fn () => [
            'estado' => EstadoAnimal::Baja,
        ]);
    }

    /**
     * Animal del que no se conoce la fecha de nacimiento.
     */
    public function fechaDesconocida(): static
    {
        return $this->state(fn () => [
            'fecha_nacimiento' => null,
            'precision_nacimiento' => PrecisionFecha::Desconocida,
        ]);
    }
}
