<?php

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
});
