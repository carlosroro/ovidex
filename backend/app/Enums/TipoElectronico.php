<?php

namespace App\Enums;

/**
 * Identificador electrónico que lleva el animal, además del crotal
 * convencional con el código oficial.
 */
enum TipoElectronico: string
{
    case Bolo = 'bolo';
    case CrotalElectronico = 'crotal_electronico';
    case Ninguno = 'ninguno';
}
