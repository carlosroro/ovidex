import { useRef, useState } from 'react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { Navigate, useLocation } from 'react-router'
import Aviso from '../componentes/Aviso.jsx'
import Boton from '../componentes/Boton.jsx'
import CampoContrasena from '../componentes/CampoContrasena.jsx'
import CampoTexto from '../componentes/CampoTexto.jsx'
import Casilla from '../componentes/Casilla.jsx'
import PantallaSimple from '../componentes/PantallaSimple.jsx'
import { useSesion } from '../sesion/contexto.js'
import './Login.css'

// Texto que se muestra para cada error al iniciar sesión
function mensajeDeError(error) {
  if (error?.tipo === 'red') {
    return 'No se puede conectar con el servidor. Comprueba que estás en la wifi de casa y que el servidor está encendido.'
  }
  // 422 (credenciales) y 429 (demasiados intentos): el servidor ya da el
  // mensaje adecuado, sin decir si falla el usuario o la contraseña
  if (error?.estado === 422) {
    return error.datos?.message ?? 'Usuario o contraseña incorrectos.'
  }
  if (error?.estado === 429) {
    return error.datos?.message ?? 'Demasiados intentos. Espera un momento.'
  }
  return 'No se ha podido iniciar sesión. Vuelve a intentarlo.'
}

// Dirección a la que ir después de entrar: la que se quería abrir, o Inicio
function destinoTrasEntrar(ubicacion) {
  const desde = ubicacion.state?.desde
  if (!desde?.pathname || desde.pathname === '/login') return '/'
  return `${desde.pathname}${desde.search ?? ''}${desde.hash ?? ''}`
}

function Login() {
  const { estado, iniciarSesion } = useSesion()
  const ubicacion = useLocation()

  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [recordar, setRecordar] = useState(true) // marcada por defecto
  const [erroresCampos, setErroresCampos] = useState({})
  const [errorGeneral, setErrorGeneral] = useState(null)
  const [enviando, setEnviando] = useState(false)

  // Referencias a los campos, para poder ponerles el foco
  const refUsuario = useRef(null)
  const refPassword = useRef(null)

  // Con sesión (ya la tenía, o acaba de entrar), se va a la pantalla que toca.
  // replace: el botón atrás no vuelve al login.
  if (estado === 'iniciada') {
    return <Navigate to={destinoTrasEntrar(ubicacion)} replace />
  }

  // Mientras se comprueba si ya hay sesión, no se enseña el formulario
  if (estado === 'comprobando') {
    return (
      <PantallaSimple centrada>
        <p role="status" className="pantalla-simple__mensaje">
          Comprobando la sesión…
        </p>
      </PantallaSimple>
    )
  }

  async function entrar(evento) {
    // Evita que el navegador envíe el formulario y recargue la página
    evento.preventDefault()

    const errores = {}
    if (!usuario.trim()) errores.usuario = 'Escribe tu usuario.'
    if (!password) errores.password = 'Escribe tu contraseña.'
    setErroresCampos(errores)
    setErrorGeneral(null)

    if (errores.usuario) return refUsuario.current?.focus()
    if (errores.password) return refPassword.current?.focus()

    setEnviando(true)
    try {
      // Si va bien, la sesión pasa a "iniciada" y el if de arriba redirige
      await iniciarSesion({ usuario: usuario.trim(), password, recordar })
    } catch (error) {
      setErrorGeneral(mensajeDeError(error))
      setPassword('')
      refPassword.current?.focus()
      setEnviando(false)
    }
  }

  return (
    <PantallaSimple>
      <header className="login__cabecera">
        <div className="login__logotipo">
          <ShieldCheck size={48} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <h1 className="login__titulo">Ovidex</h1>
        <p className="login__frase">
          Censo, sanidad e inventario de la explotación
        </p>
      </header>

      {/* noValidate: los campos vacíos los comprueba la propia pantalla */}
      <form className="login__formulario" onSubmit={entrar} noValidate>
        <CampoTexto
          ref={refUsuario}
          etiqueta="Usuario"
          placeholder="Tu nombre de usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          error={erroresCampos.usuario}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
        />
        <CampoContrasena
          ref={refPassword}
          etiqueta="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={erroresCampos.password}
          autoComplete="current-password"
          enterKeyHint="go"
        />
        <Casilla
          checked={recordar}
          onChange={(e) => setRecordar(e.target.checked)}
        >
          Mantener la sesión en este móvil
        </Casilla>

        {errorGeneral && <Aviso variante="error" titulo={errorGeneral} />}

        <Boton
          type="submit"
          bloque
          disabled={enviando}
          className="login__entrar"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </Boton>
      </form>

      <p className="login__nota">
        <LockKeyhole size={22} aria-hidden="true" />
        Acceso privado. Pide tus datos de acceso a quien administra la app.
      </p>
    </PantallaSimple>
  )
}

export default Login
