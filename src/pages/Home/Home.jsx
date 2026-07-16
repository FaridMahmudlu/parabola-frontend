import React from 'react'
import Header from '../../components/Header/Header'
import Katalog from '../../components/katalog/Katalog'
import Cothing from '../../components/clothing/Cothing'

function Home  () {
  return (
    <>
      <Header/>
      <main>
        <Katalog/>
        <Cothing/>
      </main>
     

    </>
  )
   }

export default Home
