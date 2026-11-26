<?php

/*
 * Configuración propia de Ovidex.
 *
 * Laravel recomienda leer las variables del .env solo desde los archivos
 * de config/; el resto del código usa config('ovidex.…').
 */
return [

    // Contraseña de los usuarios de prueba que crea UsuariosPruebaSeeder
    // (solo en desarrollo). Sin valor, el seeder se detiene.
    'seeder_password' => env('SEEDER_PASSWORD'),

];
