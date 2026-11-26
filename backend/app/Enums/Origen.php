<?php

namespace App\Enums;

/**
 * De dónde viene el animal.
 */
enum Origen: string
{
    case Nacida = 'nacida';
    case Comprada = 'comprada';
}
