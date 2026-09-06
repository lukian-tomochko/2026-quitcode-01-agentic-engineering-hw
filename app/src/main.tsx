import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PorscheDesignSystemProvider } from '@porsche-design-system/components-react'
// PDS design tokens (--p-color-*, --p-spacing-*, --p-typescale-*) plus the
// global reset. Without this the components hydrate but render unstyled, and
// the tokens our own layout CSS relies on would be undefined.
import '@porsche-design-system/components-react/index.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PorscheDesignSystemProvider>
      <App />
    </PorscheDesignSystemProvider>
  </StrictMode>,
)
