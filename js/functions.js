(() => {
  "use strict";

  const fadeKeyframes = Array.from({ length: 61 }, (_, step) => ({
    opacity: (1 - Math.cos((Math.PI * step) / 60)) / 2,
    offset: step / 60
  }));

  document.addEventListener("DOMContentLoaded", initialize, { once: true });

  function initialize() {
    const loveHeart = document.getElementById("loveHeart");
    const canvas = document.getElementById("garden");
    const code = document.getElementById("code");
    const context = canvas.getContext?.("2d");

    if (!context) {
      const message = document.createElement("div");
      message.id = "errorMsg";
      message.textContent =
        "Your browser doesn't support Canvas. Please use a modern browser.";
      document.body.appendChild(message);
      code.style.display = "none";
      return;
    }

    canvas.width = loveHeart.clientWidth;
    canvas.height = loveHeart.clientHeight;
    context.globalCompositeOperation = "lighter";
    const garden = new Garden(context);
    const offsetX = canvas.width / 2;
    const offsetY = canvas.height / 2 - 55;

    // Mobile browsers can expand the layout viewport for this fixed-width page.
    // Keep the original window-based centering while CSS owns the layout.
    function updateViewport() {
      document.documentElement.style.setProperty(
        "--viewport-width",
        `${window.innerWidth}px`
      );
      document.documentElement.style.setProperty(
        "--viewport-height",
        `${window.innerHeight}px`
      );
    }

    // Measure before adding the outer gutter, matching the original layout order.
    const content = document.getElementById("content");
    content.style.marginInlineStart = "0px";
    updateViewport();
    content.style.removeProperty("margin-inline-start");
    window.addEventListener("resize", updateViewport);
    let heartComplete = false;
    const renderTimer = setInterval(() => {
      garden.render();
      if (heartComplete && garden.isIdle) clearInterval(renderTimer);
    }, Garden.frameInterval);

    const messages = document.getElementById("messages");
    const loveNote = document.getElementById("loveu");
    setTimeout(() => {
      startHeartAnimation(garden, offsetX, offsetY, async () => {
        heartComplete = true;
        await fadeIn(messages, 5000);
        await fadeIn(loveNote, 3000);
      });
    }, 3000);

    // Preserve the original date: February 1, 2011, in the visitor's local time.
    const updateClock = createClock(
      document.getElementById("elapseClock"),
      new Date(2011, 1, 1)
    );
    updateClock();
    setInterval(updateClock, 500);
    typewriter(code);
  }

  function getHeartPoint(angle, offsetX, offsetY) {
    const t = angle / Math.PI;
    const x = 19.5 * (16 * Math.sin(t) ** 3);
    const y =
      -20 *
      (13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t));
    return [offsetX + x, offsetY + y];
  }

  function startHeartAnimation(garden, offsetX, offsetY, onComplete) {
    const heart = [];
    let angle = 10;
    const minDistance = Garden.options.bloomRadius.max * 1.3;
    const timer = setInterval(() => {
      const point = getHeartPoint(angle, offsetX, offsetY);
      const canDraw = heart.every(
        ([x, y]) => Math.hypot(x - point[0], y - point[1]) >= minDistance
      );

      if (canDraw) {
        heart.push(point);
        garden.createRandomBloom(point[0], point[1]);
      }
      if (angle >= 30) {
        clearInterval(timer);
        onComplete();
      } else {
        angle += 0.2;
      }
    }, 50);
  }

  function typewriter(element) {
    const html = element.innerHTML;
    let progress = 0;
    element.innerHTML = "";
    const timer = setInterval(() => {
      if (html[progress] === "<") {
        progress = html.indexOf(">", progress) + 1;
      } else {
        progress++;
      }
      const complete = progress >= html.length;
      element.innerHTML =
        html.slice(0, progress) + (!complete && progress % 2 === 1 ? "_" : "");
      if (complete) clearInterval(timer);
    }, 75);
  }

  function createClock(element, startDate) {
    const units = ["days", "hours", "minutes", "seconds"];
    const digits = units.map((unit, index) => {
      const digit = document.createElement("span");
      digit.className = "digit";
      element.append(digit, ` ${unit}${index < units.length - 1 ? " " : ""}`);
      return digit;
    });
    const startTime = startDate.getTime();
    let previousSeconds;

    return () => {
      const seconds = Math.floor((Date.now() - startTime) / 1000);
      if (seconds === previousSeconds) return;
      previousSeconds = seconds;
      const values = [
        Math.floor(seconds / 86400),
        Math.floor((seconds % 86400) / 3600),
        Math.floor((seconds % 3600) / 60),
        seconds % 60
      ];
      digits.forEach((digit, index) => {
        digit.textContent = String(values[index]).padStart(
          index === 0 ? 1 : 2,
          "0"
        );
      });
    };
  }

  async function fadeIn(element, duration) {
    element.style.display = "block";
    await element.animate(fadeKeyframes, { duration, easing: "linear" })
      .finished;
  }
})();
