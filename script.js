// ── Scroll Reveal Animation ──
const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, observerRef) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observerRef.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}

// ── Dynamic Footer Year ──
const yearElement = document.getElementById("year");
if (yearElement) {
  yearElement.textContent = String(new Date().getFullYear());
}

// ── Contact Form → Firestore ──
const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitBtn = document.getElementById("contact-submit");
    const statusEl = document.getElementById("form-status");
    const name = document.getElementById("contact-name").value.trim();
    const email = document.getElementById("contact-email").value.trim();
    const subject = document.getElementById("contact-subject").value;
    const message = document.getElementById("contact-message").value.trim();

    // Basic validation
    if (!name || !email || !message) {
      statusEl.textContent = "Please fill in all required fields.";
      statusEl.className = "form-status form-error";
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      statusEl.textContent = "Please enter a valid email address.";
      statusEl.className = "form-status form-error";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    statusEl.textContent = "";
    statusEl.className = "form-status";

    try {
      await db.collection("contacts").add({
        name: name,
        email: email,
        subject: subject,
        message: message,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: "new"
      });

      // Track form submission event
      if (typeof analytics !== "undefined") {
        analytics.logEvent("contact_form_submit", { subject: subject });
      }

      contactForm.reset();
      statusEl.textContent = "Message sent! We'll get back to you soon.";
      statusEl.className = "form-status form-success";
      submitBtn.textContent = "Send Message";
      submitBtn.disabled = false;
    } catch (err) {
      console.error("Contact form error:", err);
      statusEl.textContent = "Something went wrong. Please email us at info@essentiallayer.com.";
      statusEl.className = "form-status form-error";
      submitBtn.textContent = "Send Message";
      submitBtn.disabled = false;
    }
  });
}

// ── Analytics: Track Section Views ──
if (typeof analytics !== "undefined" && "IntersectionObserver" in window) {
  const sections = document.querySelectorAll("section[id]");
  const analyticsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          analytics.logEvent("section_view", {
            section_id: entry.target.id
          });
          analyticsObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  sections.forEach((section) => analyticsObserver.observe(section));
}

// ── Analytics: Track Outbound Clicks ──
if (typeof analytics !== "undefined") {
  document.addEventListener("click", function (e) {
    const link = e.target.closest('a[target="_blank"]');
    if (link) {
      analytics.logEvent("outbound_click", {
        url: link.href,
        link_text: link.textContent.trim().substring(0, 100)
      });
    }
  });
}
