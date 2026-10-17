import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { AppRoutes } from './app/routes'
import './styles/tokens.css'
import './styles/global.css'
import { setVirtualize } from './store'

// An informational benchmark switch; never exposed as a product control.
if (new URLSearchParams(window.location.search).get('virtualize') === 'off') setVirtualize(false)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter><AppRoutes /></BrowserRouter>
  </StrictMode>,
)
