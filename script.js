document.addEventListener("DOMContentLoaded", () => {
  // 1. Détection fluide de la navigation (requestAnimationFrame)
  const sections = document.querySelectorAll("section");
  const dockLinks = document.querySelectorAll(".dock-link");
  let ticking = false;

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        let current = "";
        sections.forEach((section) => {
          if (window.scrollY >= section.offsetTop - 250) {
            current = section.getAttribute("id");
          }
        });
        dockLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
        });

        // Animations au défilement fluides (descente et remontée)
        document.querySelectorAll(".reveal").forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.9 && rect.bottom > 40) {
            el.classList.add("visible");
          } else {
            el.classList.remove("visible");
          }
        });

        ticking = false;
      });
      ticking = true;
    }
  });

  // 2. Chargement des données dynamiques depuis data.json
  fetch("data.json")
    .then((res) => res.json())
    .then((data) => {
      initCertifications(data.certifications);
      initProjects(data.projets);
    })
    .catch((err) => console.error("Erreur de chargement de data.json :", err));

  // 3. Initialisation du Carrousel vertical
  function initCertifications(certs) {
    const carousel = document.getElementById("certifCarousel");
    const dotsContainer = document.getElementById("carouselDots");
    if (!carousel) return;

    carousel.innerHTML = "";
    dotsContainer.innerHTML = "";

    certs.forEach((cert, i) => {
      const slide = document.createElement("div");
      slide.className = "certif-card liquid-card v-slide";
      slide.setAttribute("data-index", i);
      slide.innerHTML = `
        <div class="certif-logo-wrap">
          <div class="certif-logo-oc" style="background: ${cert.couleur}">
            <i class="fa-solid ${cert.icone}"></i>
            <span>${cert.organisme}</span>
          </div>
        </div>
        <div class="certif-content">
          <div class="certif-header">
            <h3>${cert.titre}</h3>
            <span class="${cert.statut === "Obtenue" ? "badge-status-green" : "badge-status-pending"}">${cert.statut}</span>
          </div>
          <p class="certif-desc">${cert.description}</p>
          <span class="certif-meta">${cert.organisme} - ${cert.date}</span>
        </div>
      `;
      carousel.appendChild(slide);

      const dot = document.createElement("div");
      dot.className = "v-dot" + (i === 0 ? " active" : "");
      dot.addEventListener("click", () => updateCarousel(i));
      dotsContainer.appendChild(dot);
    });

    const slides = carousel.querySelectorAll(".v-slide");
    const dots = dotsContainer.querySelectorAll(".v-dot");
    let currentIndex = 0;
    const total = slides.length;
    let isThrottled = false;

    function updateCarousel(newIdx) {
      currentIndex = (newIdx + total) % total;
      slides.forEach((slide, i) => {
        slide.className = "certif-card liquid-card v-slide";
        const diff = (i - currentIndex + total) % total;
        if (diff === 0) slide.classList.add("active");
        else if (diff === total - 1) slide.classList.add("prev");
        else if (diff === 1) slide.classList.add("next");
        else if (diff > 1 && diff <= total / 2) slide.classList.add("hidden-bottom");
        else slide.classList.add("hidden-top");
      });
      dots.forEach((dot, i) => dot.classList.toggle("active", i === currentIndex));
    }

    carousel.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (isThrottled) return;
      isThrottled = true;
      setTimeout(() => (isThrottled = false), 250);
      updateCarousel(e.deltaY > 0 ? currentIndex + 1 : currentIndex - 1);
    }, { passive: false });

    slides.forEach((s) => {
      s.addEventListener("click", () => updateCarousel(parseInt(s.getAttribute("data-index"), 10)));
    });

    updateCarousel(0);
  }

  // 4. Initialisation des Projets et de leurs Modales
  function initProjects(projets) {
    const container = document.getElementById("projectsContainer");
    const modalsContainer = document.getElementById("dynamicModalsContainer");
    if (!container) return;

    container.innerHTML = "";
    modalsContainer.innerHTML = "";

    projets.forEach((p) => {
      // Carte projet
      const card = document.createElement("div");
      card.className = "project-box liquid-card";
      card.setAttribute("data-category", p.categorie);
      card.innerHTML = `
        <div class="project-img-container">
          <img src="${p.imageMiniature}" alt="${p.titre}" onerror="this.src='https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80'">
          <span class="tag-context liquid-pill">${p.tag}</span>
        </div>
        <div class="project-info">
          <span class="date-lbl">${p.date}</span>
          <h3>${p.titre}</h3>
          <p>${p.resume}</p>
          <div class="tech-pills">
            ${p.techs.map((t) => `<span>${t}</span>`).join("")}
          </div>
          <div class="project-actions ${p.hasGithub ? "has-github" : ""}">
            ${
              p.hasGithub
                ? `<button class="btn btn-secondary-sm btn-liquid" disabled style="opacity: 0.5; cursor: not-allowed;">
                    <i class="fa-brands fa-github"></i> Dépôt à venir
                   </button>`
                : ""
            }
            <button class="btn btn-purple-sm btn-liquid open-modal" data-target="modal-${p.id}">
              <i class="fa-solid fa-circle-info"></i> Plus d'infos
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);

      // Fenêtre modale du projet
      const modal = document.createElement("div");
      modal.className = "modal-backdrop";
      modal.id = `modal-${p.id}`;
      modal.innerHTML = `
        <div class="modal-box liquid-card">
          <button class="close-btn">&times;</button>
          <span class="badge-tag liquid-pill">${p.tag}</span>
          <h2>${p.titre}</h2>
          <p class="modal-period">${p.date}</p>
          ${
            p.details.images && p.details.images.length > 0
              ? `<div class="screenshots-grid">
                  ${p.details.images.map((img) => `<img src="${img}" alt="Capture d'écran" onerror="this.style.display='none'">`).join("")}
                </div>`
              : ""
          }
          <h4>Détails du projet</h4>
          <p class="modal-txt">${p.details.contexte}</p>
          <h4>Points clés</h4>
          <ul class="skills-covered">
            ${p.details.points.map((pt) => `<li><i class="fa-solid fa-check purple-icon"></i> ${pt}</li>`).join("")}
          </ul>
        </div>
      `;
      modalsContainer.appendChild(modal);
    });

    attachModalEvents();
  }

  // 5. Gestion des filtres et modales
  const filterTabs = document.querySelectorAll(".filter-tab");
  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      filterTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const filter = tab.getAttribute("data-filter");
      document.querySelectorAll(".project-box").forEach((box) => {
        box.style.display = (filter === "all" || box.getAttribute("data-category") === filter) ? "flex" : "none";
      });
    });
  });

  function attachModalEvents() {
    document.querySelectorAll(".open-modal").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = document.getElementById(btn.getAttribute("data-target"));
        if (target) target.style.display = "flex";
      });
    });

    document.querySelectorAll(".close-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".modal-backdrop").forEach((m) => (m.style.display = "none"));
      });
    });

    window.addEventListener("click", (e) => {
      document.querySelectorAll(".modal-backdrop").forEach((m) => {
        if (e.target === m) m.style.display = "none";
      });
    });
  }
});
