<?php

namespace App\Enums;

/**
 * Qué parte de una fecha se conoce de verdad.
 *
 * La fecha se guarda siempre completa; la precisión dice cuánto fiarse de ella:
 * - Exacta: día, mes y año.
 * - Mes: mes y año (la fecha se guarda con el día 1).
 * - Anio: solo el año (la fecha se guarda como el 1 de enero).
 * - Desconocida: no hay fecha.
 */
enum PrecisionFecha: string
{
    case Exacta = 'exacta';
    case Mes = 'mes';
    case Anio = 'anio';
    case Desconocida = 'desconocida';
}
