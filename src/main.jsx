import { createRoot } from 'react-dom/client'
import {Provider} from 'react-redux'
import {store} from "./app/store.js"
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { azLocalization } from './assets/pages/clerk-localization.js'
import { injectSpeedInsights } from '@vercel/speed-insights'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

injectSpeedInsights()

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY}
        localization={azLocalization}
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: '#c9a96e',
            colorBackground: '#0c0c0c',
            colorInputBackground: '#161616',
            fontFamily: 'Montserrat, sans-serif'
          }
        }}
      >
        <App/>
      </ClerkProvider>
    </BrowserRouter>
  </Provider>
)
