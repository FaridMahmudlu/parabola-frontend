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
            Bədən parametrlərinizə əsasən geyimlərin sizə uyğunluq dərəcəsini analiz edin.
          </p>
          <span data-aos="fade-up" className="disclaimer-text" style={{ display: 'block', fontSize: '11px', color: '#7a7570', marginTop: '-8px', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.5px' }}>
            *Tövsiyələr daxil edilən göstəricilərə əsaslanır və mütləq uyğunluğa zəmanət vermir.
          </span>
        </div>
      </div>
    </section>
  )
}

export default Katalog
