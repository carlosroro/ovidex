import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'

// Fuentes servidas desde el propio proyecto (sin Google Fonts)
import '@fontsource-variable/archivo'
import '@fontsource-variable/inter'

// Primero las variables del tema y después los estilos generales que las usan
import './estilos/tema.css'
import './estilos/base.css'

import App from './App.jsx'
import SesionProvider from './sesion/SesionProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/*
      BrowserRouter usa la dirección del navegador (/rebano, /mas…).
      useTransitions={false}: cada cambio de dirección se aplica al momento.
      Por defecto React Router los aplica como "transición" (pueden quedar
      para después), y en Rebaño, donde la búsqueda y los filtros viven en la
      dirección, dos toques muy seguidos (borrar la búsqueda y elegir un
      filtro) hacían que el segundo deshiciera el primero.
    */}
    <BrowserRouter useTransitions={false}>
      {/* La sesión, disponible en toda la app con useSesion() */}
      <SesionProvider>
        <App />
      </SesionProvider>
    </BrowserRouter>
  </StrictMode>,
)
