<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Los datos de prueba solo se crean en desarrollo y en las pruebas,
        // nunca en la instalación de uso.
        if (app()->environment(['local', 'testing'])) {
            // Primero los usuarios: el censo de prueba queda a nombre de uno de ellos.
            $this->call(UsuariosPruebaSeeder::class);
            $this->call(CensoPruebaSeeder::class);
        }
    }
}
