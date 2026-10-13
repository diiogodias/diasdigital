(function () {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  const overlay = document.querySelector(".nav-overlay");

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

  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const honeypot = contactForm.querySelector('[name="_honey"]');
      if (honeypot && honeypot.value) {
        return;
      }

      const wrap = contactForm.closest(".form-card") || contactForm.parentElement;
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const success = wrap.querySelector(".form-success");
      const errorBox = wrap.querySelector(".form-error");

      if (submitBtn) submitBtn.disabled = true;
      if (errorBox) errorBox.style.display = "none";

      const payload = {
        name: (contactForm.elements.namedItem("name") || {}).value || "",
        email: (contactForm.elements.namedItem("email") || {}).value || "",
        phone: (contactForm.elements.namedItem("phone") || {}).value || "",
        business: (contactForm.elements.namedItem("business") || {}).value || "",
        service: (contactForm.elements.namedItem("service") || {}).value || "",
        budget: (contactForm.elements.namedItem("budget") || {}).value || "",
        message: (contactForm.elements.namedItem("message") || {}).value || "",
      };

      fetch("https://dias-ai-proxy.glhf077.workers.dev/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (response) {
          if (!response.ok) throw new Error("Form error");
          return response.json();
        })
        .then(function (data) {
          if (!data || !data.success) throw new Error("Form error");
          if (success) success.style.display = "block";
          contactForm.reset();
        })
        .catch(function () {
          if (errorBox) errorBox.style.display = "block";
        })
        .then(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  const teardownForm = document.getElementById("teardown-form");
  if (teardownForm) {
    const wrap = teardownForm.closest(".form-card") || teardownForm.parentElement;
    const success = wrap.querySelector(".form-success");

    if (/[?&]sent=1(?:&|$)/.test(window.location.search)) {
      if (success) success.style.display = "block";
      teardownForm.hidden = true;
    }

    teardownForm.addEventListener("submit", function (event) {
      const honeypot = teardownForm.querySelector('[name="_honey"]');
      if (honeypot && honeypot.value) {
        event.preventDefault();
      }
    });
  }

  const chatForm = document.getElementById("chat-form");
  if (chatForm) {
    const CHAT_SYSTEM_PROMPT =
      "You are the AI assistant for The Corner Café, a friendly independent café in Crawley, Surrey. Answer questions as if you work there. Keep answers short, friendly and helpful.\n\n" +
      "Business details:\n" +
      "- Name: The Corner Café\n" +
      "- Address: 12 High Street, Crawley, RH10 1BG\n" +
      "- Phone: 01293 000000\n" +
      "- Opening hours: Mon-Fri 7:30am-5pm, Sat 8am-4pm, Sun 9am-3pm\n" +
      "- Specialities: Full English breakfast, homemade cakes, specialty coffee\n" +
      "- Bookings: Call or message us\n" +
      "- WiFi: Yes, free for customers\n\n" +
      "If asked about anything you don't know, say you'll pass the message to the owner and ask for their name and phone number.\n" +
      "Keep responses under 3 sentences where possible.";

    const chatMessages = document.getElementById("chat-messages");
    const chatInput = document.getElementById("chat-input");
    const chatSend = document.getElementById("chat-send");
    const failText = "Sorry, I'm having trouble connecting. Please try again.";

    function appendBubble(text, role) {
      const bubble = document.createElement("div");
      bubble.className =
        "chat-bubble " + (role === "user" ? "chat-bubble-user" : "chat-bubble-bot");
      bubble.textContent = text;
      chatMessages.appendChild(bubble);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return bubble;
    }

    function showTyping() {
      const typing = document.createElement("div");
      typing.className = "chat-bubble chat-bubble-bot chat-typing";
      typing.setAttribute("aria-label", "Assistant is typing");
      typing.innerHTML = "<span></span><span></span><span></span>";
      chatMessages.appendChild(typing);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return typing;
    }

    chatForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const text = (chatInput.value || "").trim();
      if (!text) return;

      appendBubble(text, "user");
      chatInput.value = "";

      if (chatSend) chatSend.disabled = true;
      chatInput.disabled = true;
      const typing = showTyping();

      fetch("https://dias-ai-proxy.glhf077.workers.dev/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          systemPrompt: CHAT_SYSTEM_PROMPT,
        }),
      })
        .then(function (response) {
          if (!response.ok) throw new Error("API error");
          return response.json();
        })
        .then(function (data) {
          const reply = data && data.response ? data.response : failText;
          typing.remove();
          appendBubble(reply, "bot");
        })
        .catch(function () {
          typing.remove();
          appendBubble(failText, "bot");
        })
        .then(function () {
          if (chatSend) chatSend.disabled = false;
          chatInput.disabled = false;
          chatInput.focus();
        });
    });
  }

  function getCookie(name) {
    const prefix = name + "=";
    const parts = document.cookie.split(";");
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (part.indexOf(prefix) === 0) {
        return decodeURIComponent(part.slice(prefix.length));
      }
    }
    return "";
  }

  function setConsentCookie(value) {
    document.cookie =
      "dias_cookie_consent=" + value + "; path=/; max-age=31536000; SameSite=Lax";
  }

  function showCookieBanner() {
    if (getCookie("dias_cookie_consent")) return;

    const banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie consent");
    banner.innerHTML =
      '<div class="cookie-banner-inner">' +
      "<p>We use cookies to improve your experience and analyse site traffic. By continuing to use this site you accept our use of cookies.</p>" +
      '<div class="cookie-banner-actions">' +
      '<button type="button" class="cookie-btn cookie-accept">Accept</button>' +
      '<button type="button" class="cookie-btn cookie-decline">Decline</button>' +
      "</div></div>";

    document.body.appendChild(banner);

    banner.querySelector(".cookie-accept").addEventListener("click", function () {
      setConsentCookie("accepted");
      banner.remove();
      if (typeof window.loadDiasAnalytics === "function") {
        window.loadDiasAnalytics();
      }
    });

    banner.querySelector(".cookie-decline").addEventListener("click", function () {
      setConsentCookie("declined");
      banner.remove();
    });
  }

  if (document.readyState === "complete") {
    showCookieBanner();
  } else {
    window.addEventListener("load", showCookieBanner);
  }
})();
