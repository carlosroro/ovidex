import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Fuentes servidas desde el propio proyecto (sin Google Fonts)
import '@fontsource-variable/archivo'
import '@fontsource-variable/inter'

// Primero las variables del tema y después los estilos generales que las usan
import './estilos/tema.css'
import './estilos/base.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
