(() => {
  "use strict";

  const whatsappNumber = "918125489664";
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.documentElement.classList.add("js-ready");

  const createWhatsAppUrl = (message) =>
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  document.querySelectorAll("[data-whatsapp-message]").forEach((link) => {
    link.href = createWhatsAppUrl(link.dataset.whatsappMessage);
  });

  const revealElements = [...document.querySelectorAll("[data-reveal]")];

  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    revealElements.forEach((element) => element.classList.add("is-revealed"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -35px" },
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  }

  const carouselControllers = [...document.querySelectorAll("[data-carousel]")].map((carousel) => {
    const slides = [...carousel.querySelectorAll("[data-carousel-slide]")];
    const dots = [...carousel.querySelectorAll("[data-carousel-dot]")];
    const interval = Number(carousel.dataset.interval) || 4500;
    let activeSlide = 0;
    let timer;
    let touchStartX = 0;

    const showSlide = (index) => {
      activeSlide = (index + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === activeSlide;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", String(!isActive));
      });

      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeSlide;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-current", String(isActive));
      });
    };

    const stop = () => window.clearInterval(timer);
    const start = () => {
      if (prefersReducedMotion || slides.length < 2 || document.hidden) return;
      stop();
      timer = window.setInterval(() => showSlide(activeSlide + 1), interval);
    };

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        showSlide(Number(dot.dataset.carouselDot));
        start();
      });
    });

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    carousel.addEventListener("focusin", stop);
    carousel.addEventListener("focusout", start);
    carousel.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0].clientX;
      },
      { passive: true },
    );
    carousel.addEventListener(
      "touchend",
      (event) => {
        const distance = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(distance) < 45) return;
        showSlide(activeSlide + (distance < 0 ? 1 : -1));
        start();
      },
      { passive: true },
    );

    showSlide(0);
    start();
    return { start, stop };
  });

  document.addEventListener("visibilitychange", () => {
    carouselControllers.forEach((controller) => {
      if (document.hidden) controller.stop();
      else controller.start();
    });
  });

  const modal = document.querySelector("#admission-modal");
  const modalDialog = modal?.querySelector(".modal__dialog");
  const modalCloseButton = modal?.querySelector(".modal__close");
  const modalCta = modal?.querySelector("[data-whatsapp-message]");
  let previouslyFocusedElement = null;
  let closeTimer;

  const getFocusableElements = () =>
    modal
      ? [...modal.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      : [];

  const openModal = () => {
    if (!modal || modal.classList.contains("is-open")) return;
    window.clearTimeout(closeTimer);
    previouslyFocusedElement = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    window.requestAnimationFrame(() => {
      modal.classList.add("is-open");
      modalCloseButton?.focus({ preventScroll: true });
    });
  };

  const closeModal = () => {
    if (!modal || !modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    closeTimer = window.setTimeout(() => {
      modal.hidden = true;
      previouslyFocusedElement?.focus?.({ preventScroll: true });
    }, prefersReducedMotion ? 0 : 240);
  };

  modal?.querySelectorAll("[data-modal-close]").forEach((element) => {
    element.addEventListener("click", closeModal);
  });

  modalCta?.addEventListener("click", () => window.setTimeout(closeModal, 80));

  document.addEventListener("keydown", (event) => {
    if (!modal?.classList.contains("is-open")) return;

    if (event.key === "Escape") {
      closeModal();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = getFocusableElements();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  modalDialog?.addEventListener("click", (event) => event.stopPropagation());

  window.setTimeout(openModal, 650);
})();
