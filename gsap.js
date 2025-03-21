// GSAP Animations for E-commerce Website

document.addEventListener("DOMContentLoaded", function () {
    // Hero Section Animation
    gsap.from(".hero-content h1", { opacity: 0, scale: 0.8, duration: 1, ease: "power2.out" });
    gsap.from(".hero-content p", { opacity: 0, y: 50, duration: 1, delay: 0.5, ease: "power2.out" });
    gsap.from(".shop-now", { opacity: 0, scale: 0.8, duration: 0.8, delay: 1, ease: "elastic.out(1, 0.5)" });

    // Navbar Animation
    gsap.to(".navbar", {
        y: 0,
        duration: 0.5,
        ease: "power2.out",
        scrollTrigger: {
            trigger: ".navbar",
            start: "top top",
            end: "+=200",
            toggleActions: "play none none reverse"
        }
    });

    // Product Cards Animation
    gsap.from(".product-card", {
        opacity: 0,
        y: 50,
        scale: 0.9,
        duration: 0.8,
        stagger: 0.2,
        scrollTrigger: {
            trigger: ".products",
            start: "top 80%",
            toggleActions: "play none none none"
        }
    });

    // Add-to-Cart Button Hover Effect
    gsap.utils.toArray(".product-card button").forEach(button => {
        button.addEventListener("mouseenter", () => {
            gsap.to(button, { scale: 1.1, duration: 0.2 });
        });
        button.addEventListener("mouseleave", () => {
            gsap.to(button, { scale: 1, duration: 0.2 });
        });
    });

    // Cart Page Slide-in Effect
    gsap.from(".cart-item", {
        opacity: 0,
        x: -50,
        duration: 0.8,
        stagger: 0.2,
        scrollTrigger: {
            trigger: ".cart-items",
            start: "top 90%",
        }
    });

    // Checkout Step-by-Step Animation
    const checkoutTimeline = gsap.timeline();
    checkoutTimeline.from(".checkout-step", { opacity: 0, y: 50, duration: 0.5, stagger: 0.3 });

    // Background Parallax Effect
    gsap.to(".background", {
        yPercent: -20,
        scrollTrigger: {
            trigger: ".background",
            start: "top bottom",
            scrub: true
        }
    });

    // Footer Fade-in Animation
    gsap.from(".footer", {
        opacity: 0,
        y: 50,
        duration: 1,
        scrollTrigger: {
            trigger: ".footer",
            start: "bottom 90%",
        }
    });
});
