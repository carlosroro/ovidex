<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Censo: ovejas y carneros en la misma tabla.
        // Los valores cerrados (sexo, estado…) se guardan como texto y en PHP
        // se representan con las enumeraciones de app/Enums.
        Schema::create('animales', function (Blueprint $table) {
            // UUID generado en el cliente (preparado para las altas sin conexión).
            $table->uuid('id')->primary();

            // Código oficial normalizado: "ES" + 12 dígitos, sin espacios.
            $table->string('codigo_oficial', 14)->unique();
            $table->string('tipo_electronico', 20);
            $table->string('nombre_o_numero', 40)->nullable();

            $table->string('sexo', 10);
            $table->boolean('reproductor')->default(false);
            $table->string('raza', 50)->nullable();

            // Fecha completa + precisión (exacta, mes, anio, desconocida).
            $table->date('fecha_nacimiento')->nullable();
            $table->string('precision_nacimiento', 12);

            $table->string('origen', 10);

            // Genealogía: madre y padre son otros animales de esta misma tabla.
            // nullOnDelete: si algún día se borrara uno a mano en la base de
            // datos, sus crías se quedan sin madre/padre en lugar de dar error.
            $table->foreignUuid('madre_id')->nullable()->constrained('animales')->nullOnDelete();
            $table->foreignUuid('padre_id')->nullable()->constrained('animales')->nullOnDelete();

            // Con índice porque la mayoría de consultas filtran por estado.
            $table->string('estado', 10)->default('activa')->index();
            $table->text('notas')->nullable();

            // Auditoría: quién creó la ficha y quién la modificó por última vez.
            $table->foreignUuid('creado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('modificado_por')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('animales');
    }
};
