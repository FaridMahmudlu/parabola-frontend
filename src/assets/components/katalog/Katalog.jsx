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
          <p data-aos="fade-right">Ölçü tövsiyəsi platforması</p>
          <h2 data-aos="fade-up">Sizə <span>uyğun</span></h2>
          <h2 data-aos="zoom-in">geyimi tapın</h2>
          <p data-aos="fade-left">
            Profil məlumatlarınıza əsasən hər geyimin uyğunluq faizini görün. 
            Mükəmməl olmağa yox, sadəcə olmağa fokuslanmışıq.
          </p>
        </div>
      </div>
    </section>
  )
}

export default Katalog
