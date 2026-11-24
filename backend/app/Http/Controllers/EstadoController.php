<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class EstadoController extends Controller
{
    /**
     * Indica si la API responde y si la base de datos está accesible.
     *
     * El detalle de un fallo de la base de datos solo se guarda en el log:
     * nunca se devuelve al cliente, porque podría revelar datos de conexión.
     */
    public function __invoke(): JsonResponse
    {
        try {
            DB::select('SELECT 1');
            $baseDatosOk = true;
        } catch (Throwable $e) {
            Log::error('Estado: la base de datos no responde.', ['excepcion' => $e]);
            $baseDatosOk = false;
        }

        return response()->json(
            [
                'api' => 'ok',
                'base_datos' => $baseDatosOk ? 'ok' : 'error',
            ],
            $baseDatosOk ? 200 : 503,
        );
    }
}
