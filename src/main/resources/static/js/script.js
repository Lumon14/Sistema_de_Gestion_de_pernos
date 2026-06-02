
// Define tu array de imágenes
const images = [
    '/images/PERNOS.png',
    '/images/2.png'
];

var swiper = new Swiper(".mySwiper-1", {
    loop: true,
    autoplay: {
        delay: 3000,
        disableOnInteraction: false,
    },
    speed: 1000,
    on: {
        slideChange: function () {
            const activeIndex = this.realIndex;
            const heroSection = document.getElementById('hero');
            heroSection.style.backgroundImage = `url(${images[activeIndex]})`;
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.getElementById('hero');
    heroSection.style.backgroundImage = `url(${images[0]})`;
    heroSection.style.backgroundSize = 'cover';
    heroSection.style.backgroundPosition = 'center';
    heroSection.style.backgroundRepeat = 'no-repeat';
});
// Inicializa el segundo Swiper para el carrusel de productos
var swiper2 = new Swiper(".mySwiper-2", {
    loop: true,
    autoplay: {
        delay: 4000,
        disableOnInteraction: false,
    },
    speed: 800,
    pagination: {
        el: ".mySwiper-2 .swiper-pagination",
        clickable: true,
    },
    navigation: {
        nextEl: ".mySwiper-2 .swiper-button-next",
        prevEl: ".mySwiper-2 .swiper-button-prev",
    },
    breakpoints: {
        640: {
            slidesPerView: 1,
            spaceBetween: 20,
        },
        768: {
            slidesPerView: 2,
            spaceBetween: 30,
        },
        1024: {
            slidesPerView: 3,
            spaceBetween: 40,
        },
    }
});
