// Init AOS animations
AOS.init({
  duration: 800,
  once: true
});

// Typed.js for hero tagline
new Typed('#typed-tagline', {
  strings: [
    "Basketball Player",
    "League MVP",
    "Three-Point Specialist",
    "Team Leader"
  ],
  typeSpeed: 50,
  backSpeed: 25,
  backDelay: 1500,
  loop: true
});

// GSAP float ball animation (optional)
gsap.to(".float-ball", {
  y: 15,
  repeat: -1,
  yoyo: true,
  ease: "power1.inOut",
  duration: 2
});

// Stats counter animation
document.addEventListener("DOMContentLoaded", () => {
  const counters = document.querySelectorAll(".num");
  counters.forEach(counter => {
    let target = parseFloat(counter.dataset.count);
    let count = 0;
    let increment = target / 100;
    let interval = setInterval(() => {
      count += increment;
      if (count >= target) {
        count = target;
        clearInterval(interval);
      }
      counter.textContent = count % 1 === 0 ? count : count.toFixed(1);
    }, 20);
  });
});

// Gallery lightbox
const gridItems = document.querySelectorAll(".grid-item img");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");
const lbClose = document.getElementById("lbClose");

gridItems.forEach(img => {
  img.addEventListener("click", () => {
    lightbox.classList.add("show");
    lbImg.src = img.src.replace("thumbs/", "");
  });
});
lbClose.addEventListener("click", () => {
  lightbox.classList.remove("show");
});
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) lightbox.classList.remove("show");
});

// Dynamic year
document.getElementById("year").textContent = new Date().getFullYear();
// ===== Top Animated Glow Effect =====
const topAnim = document.querySelector(".top-animation");
let glowX = 50;
let glowY = 50;

function animateTopGlow() {
  glowX += 0.3 * Math.sin(Date.now() / 800);
  glowY += 0.3 * Math.cos(Date.now() / 1200);
  topAnim.style.setProperty("--x", `${50 + glowX / 5}%`);
  topAnim.style.setProperty("--y", `${50 + glowY / 5}%`);
  requestAnimationFrame(animateTopGlow);
}
animateTopGlow();

// ===== Fade-Up Typing for About Section =====
const aboutTextEl = document.getElementById("about-text");
const aboutMessage = "I am a passionate basketball player with years of experience on the court. I play as a shooting guard, known for my speed, precision, and dedication to the game. My journey is fueled by discipline, teamwork, and a drive to win.";

let aboutIndex = 0;
let typingStarted = false;

function typeAboutText() {
    if (aboutIndex < aboutMessage.length) {
        aboutTextEl.textContent += aboutMessage.charAt(aboutIndex);
        aboutIndex++;
        setTimeout(typeAboutText, 40); // typing speed in ms
    }
}

// Detect when About section enters viewport
window.addEventListener("scroll", () => {
    const rect = aboutTextEl.getBoundingClientRect();
    if (!typingStarted && rect.top < window.innerHeight - 100) {
        typingStarted = true;
        aboutTextEl.classList.add("show"); // fade up
        setTimeout(typeAboutText, 300); // small delay before typing
    }
});
