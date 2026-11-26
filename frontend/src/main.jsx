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
    {/* BrowserRouter usa la dirección del navegador (/rebano, /mas…) */}
    <BrowserRouter>
      {/* La sesión, disponible en toda la app con useSesion() */}
      <SesionProvider>
        <App />
      </SesionProvider>
    </BrowserRouter>
  </StrictMode>,
)
