<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Symfony\Component\HttpFoundation\Response;

/**
 * Solo deja pasar peticiones que vienen del frontend de Ovidex
 * (las direcciones de SANCTUM_STATEFUL_DOMAINS).
 *
 * Sanctum solo activa la sesión y la protección CSRF para esas peticiones.
 * Una petición desde otro sitio llegaría al login sin sesión; aquí se
 * rechaza igual que un fallo de CSRF (419).
 */
class SoloDesdeFrontend
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! EnsureFrontendRequestsAreStateful::fromFrontend($request)) {
            throw new TokenMismatchException('CSRF token mismatch.');
        }

        return $next($request);
    }
}
