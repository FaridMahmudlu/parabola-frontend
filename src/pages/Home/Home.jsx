import React, { lazy, Suspense } from 'react'
import Header from '../../components/Header/Header'
import Katalog from '../../components/katalog/Katalog'
import LoadingSpinner from '../../components/Loading/LoadingSpinner'

const Cothing = lazy(() => import('../../components/clothing/Cothing'))

function Home() {
  return (
    <>
      <Header/>
      <main>
        <Katalog/>
        <Suspense fallback={<LoadingSpinner text="Geyim kataloqu yüklənir..." fullScreen={false} iconType="catalog" />}>
          <Cothing/>
        </Suspense>
      </main>
    </>
  )
}

export default Home
