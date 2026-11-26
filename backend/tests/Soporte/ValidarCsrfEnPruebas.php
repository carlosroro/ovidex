<?php

namespace Tests\Soporte;

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;

/**
 * La protección CSRF de Laravel se desactiva sola en las pruebas.
 * Esta versión la mantiene activa, para las pruebas que la comprueban.
 */
class ValidarCsrfEnPruebas extends ValidateCsrfToken
{
    protected function runningUnitTests()
    {
        return false;
    }
}
