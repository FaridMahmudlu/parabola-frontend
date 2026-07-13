import React, { useEffect } from 'react'
import AOS from "aos"
import "aos/dist/aos.css"
import "./katalog.css"

function Katalog() {

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true,
      offset: 120
    })
  }, [])

  return (
    <section id="catalog" className='CatalogContainer'>
      <div className="catalogcontainertext">
        <div className="TopText">
          <p data-aos="fade-right" className="sub-tag">ÖLÇÜ UYĞUNLUĞU PLATFORMASI</p>
          <h2 data-aos="fade-up">Sizə ən <span>uyğun</span> geyimi tapın</h2>
          <p data-aos="fade-left" className="description-text">
            Bədən tipinizə əsasən hər bir geyimin sizə uyğunluq faizini öyrənin. 
            Dəqiq ölçü analizimiz sayəsində yanlış seçim etməkdən sığortalanın.
          </p>
        </div>
      </div>
    </section>
  )
}

export default Katalog
