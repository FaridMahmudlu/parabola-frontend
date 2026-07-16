import React, { lazy, Suspense } from 'react'
import Header from '../../components/Header/Header'
import Katalog from '../../components/katalog/Katalog'

const Cothing = lazy(() => import('../../components/clothing/Cothing'))

function Home() {
  return (
    <>
      <Header/>
      <main>
        <Katalog/>
        <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#c9a96e', fontFamily: 'Montserrat, sans-serif', fontSize: '14px', letterSpacing: '1px' }}>Katalog yüklənir...</div>}>
          <Cothing/>
        </Suspense>
      </main>
    </>
  )
}

export default Home
