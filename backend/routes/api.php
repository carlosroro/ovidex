<?php

use App\Http\Controllers\AnimalController;
use App\Http\Controllers\EstadoController;
use App\Http\Controllers\SesionController;
use App\Http\Middleware\SoloDesdeFrontend;
use Illuminate\Support\Facades\Route;

/*
 * Rutas públicas (sin sesión). Además de estas, Sanctum registra
 * GET /api/sanctum/csrf-cookie.
 */

// Comprobación de la conexión.
Route::get('/estado', EstadoController::class);

// Inicio de sesión.
Route::post('/login', [SesionController::class, 'iniciar'])->middleware(SoloDesdeFrontend::class);

/*
 * Rutas que requieren sesión iniciada. Sin sesión responden 401.
 * Toda ruta nueva de la app va dentro de este grupo.
 */
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [SesionController::class, 'cerrar']);
    Route::get('/usuario', [SesionController::class, 'actual']);

    // Censo: GET /animales, GET /animales/{animal}, POST /animales y
    // PUT /animales/{animal}. No hay ruta de borrar: un DELETE responde 405.
    // - parameters: sin esto el parámetro se llamaría {animale} (Laravel
    //   forma el singular en inglés quitando la "s").
    // - where: solo se aceptan UUID; cualquier otra cosa responde 404 sin
    //   llegar a consultar la base de datos.
    Route::apiResource('animales', AnimalController::class)
        ->only(['index', 'show', 'store', 'update'])
        ->parameters(['animales' => 'animal'])
        ->where(['animal' => '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}']);
});
