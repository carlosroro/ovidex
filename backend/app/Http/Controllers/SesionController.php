<?php

namespace App\Http\Controllers;

use App\Http\Requests\IniciarSesionRequest;
use App\Http\Resources\UsuarioResource;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

/**
 * Inicio y cierre de sesión, y datos del usuario actual.
 */
class SesionController extends Controller
{
    /**
     * POST /api/login
     */
    public function iniciar(IniciarSesionRequest $request): UsuarioResource
    {
        // Valida los datos (lo hace el FormRequest) y comprueba las credenciales
        $request->autenticar();

        // Nuevo identificador de sesión: evita la "fijación de sesión"
        $request->session()->regenerate();

        return new UsuarioResource($request->user());
    }

    /**
     * POST /api/logout
     */
    public function cerrar(Request $request): Response
    {
        // Cierra la sesión y anula la cookie "recordarme" (cambia remember_token)
        Auth::guard('web')->logout();

        // Borra los datos de la sesión y crea un token CSRF nuevo
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent(); // 204
    }

    /**
     * GET /api/usuario
     */
    public function actual(Request $request): UsuarioResource
    {
        return new UsuarioResource($request->user());
    }
}
