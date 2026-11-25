<?php

use App\Http\Controllers\EstadoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Comprobación de la conexión (pública, sin autenticación).
Route::get('/estado', EstadoController::class);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
