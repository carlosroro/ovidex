import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import CampoTexto from './CampoTexto.jsx'
import './CampoContrasena.css'

/*
 * Campo de contraseña con un botón (ojo) para mostrarla u ocultarla.
 * Admite las mismas props que CampoTexto (etiqueta, error, value, ref…).
 */
function CampoContrasena(props) {
  const [visible, setVisible] = useState(false)
  const Icono = visible ? EyeOff : Eye

  return (
    <CampoTexto
      {...props}
      type={visible ? 'text' : 'password'}
      accion={
        <button
          type="button"
          className="campo-contrasena__ver"
          // El nombre dice lo que hará el botón al pulsarlo
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          // aria-pressed: el lector de pantalla indica si está activado
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          <Icono size={24} aria-hidden="true" />
        </button>
      }
    />
  )
}

export default CampoContrasena
