(function () {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  const overlay = document.querySelector(".nav-overlay");
  const form = document.getElementById("contact-form");

  function setMenu(open) {
    if (!navLinks || !toggle) return;
    navLinks.classList.toggle("open", open);
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
    if (overlay) overlay.classList.toggle("show", open);
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      setMenu(!navLinks.classList.contains("open"));
    });
  }

  if (overlay) {
    overlay.addEventListener("click", function () {
      setMenu(false);
    });
  }

  if (navLinks) {
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false);
      });
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setMenu(false);
  });

  if (header) {
    window.addEventListener(
      "scroll",
      function () {
        header.style.boxShadow =
          window.scrollY > 12 ? "0 10px 30px rgba(0,0,0,0.35)" : "none";
      },
      { passive: true }
    );
  }

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("visible");
    });
  }

  document.querySelectorAll(".faq-item").forEach(function (item) {
    const button = item.querySelector("button");
    const panel = item.querySelector(".faq-panel");
    if (!button || !panel) return;

    button.addEventListener("click", function () {
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function (openItem) {
        openItem.classList.remove("open");
        const openBtn = openItem.querySelector("button");
        const openPanel = openItem.querySelector(".faq-panel");
        if (openBtn) openBtn.setAttribute("aria-expanded", "false");
        if (openPanel) openPanel.style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add("open");
        button.setAttribute("aria-expanded", "true");
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    });
  });

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const success = document.querySelector(".form-success");
      const errorBox = document.querySelector(".form-error");

      if (submitBtn) submitBtn.disabled = true;
      if (errorBox) errorBox.style.display = "none";

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      })
        .then(function (response) {
          if (!response.ok) throw new Error("Form error");
          if (success) success.style.display = "block";
          form.reset();
          form.hidden = true;
        })
        .catch(function () {
          if (errorBox) errorBox.style.display = "block";
        })
        .then(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }
})();
