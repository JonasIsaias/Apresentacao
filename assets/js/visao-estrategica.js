const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

/*
  Mantemos a Visão Geral intacta.
  Esta página apenas seleciona os seis registros estratégicos do mesmo data.json.
*/
const STRATEGIC_IDS = [
  "flag-nip",
  "agendamento-estrutura",
  "melhoria-credenciamento",
  "centralizacao-backoffice",
  "estrutura-inteligencia-negocios",
  "noc",
  "judicializacao",
  "copay"
];

const state = {
  data: null,
  topics: [],
  current: 0,
  media: [],
  mediaIndex: 0
};

async function init() {
  try {
    const response = await fetch("assets/data.json");

    if (!response.ok) {
      throw new Error("Não foi possível carregar assets/data.json");
    }

    state.data = await response.json();

    state.topics = STRATEGIC_IDS
      .map((id) => state.data.topics.find((topic) => topic.id === id))
      .filter(Boolean);

    if (state.topics.length !== STRATEGIC_IDS.length) {
      console.warn("Uma ou mais frentes estratégicas não foram encontradas no data.json.");
    }

    renderStrategyCards();
    renderTopics();
    bindEvents();
    updateCounter();
    setupObserver();

  } catch (error) {
    console.error(error);

    $("#strategyGrid").innerHTML = `
      <article class="strategy-card">
        <span class="eyebrow">ERRO</span>
        <h3>Não foi possível carregar a Visão Estratégica.</h3>
        <p>Verifique se o arquivo <strong>assets/data.json</strong> está disponível.</p>
      </article>
    `;
  }
}

function renderStrategyCards() {
  const grid = $("#strategyGrid");

  if (!grid) return;

  grid.innerHTML = state.topics.map((topic, index) => `
    <button
      class="strategy-card"
      type="button"
      data-go="${index}"
      aria-label="Abrir ${escapeHTML(topic.title)}"
    >
      <div class="strategy-number">
        <strong>${String(index + 1).padStart(2, "0")}</strong>
        <span class="strategy-category">${escapeHTML(topic.category)}</span>
      </div>

      <h3>${escapeHTML(topic.title)}</h3>
      <p>${escapeHTML(topic.summary)}</p>
      <br/>
      <p>${escapeHTML(topic.summary_1)}</p>

      <span class="strategy-arrow">→</span>
    </button>
  `).join("");

  $$(".strategy-card").forEach((card) => {
    card.addEventListener("click", () => {
      goTo(Number(card.dataset.go));
    });
  });
}

function renderTopics() {
  const list = $("#topicList");

  if (!list) return;

  list.innerHTML = state.topics.map((topic, index) => {
    const media = topic.media || [];
    const facts = topic.facts || [];

    return `
      <article
        class="topic"
        id="topic-${index}"
        data-index="${index}"
        data-search="${escapeHTML(
          `${topic.title} ${topic.category} ${topic.summary} ${facts.flat().join(" ")}`
        ).toLowerCase()}"
      >

        <div class="topic-copy">

          <div class="topic-meta">
            <span class="topic-number">
              ${String(index + 1).padStart(2, "0")} / ${String(state.topics.length).padStart(2, "0")}
            </span>

            <span class="topic-category">
              ${escapeHTML(topic.category)}
            </span>
          </div>

          <h3>${escapeHTML(topic.title)}</h3>

          <p class="topic-summary">
            ${escapeHTML(topic.summary)}
          </p>
          <br/>
          <p class="topic-summary">
            ${escapeHTML(topic.summary_1)}
          </p>

          ${createFacts(facts)}

        </div>

        <div class="media-area">
          ${createMediaGrid(topic, index, media)}
        </div>

      </article>
    `;
  }).join("");

  bindMediaButtons();
}

function createFacts(facts) {
  if (!facts.length) return "";

  return `
    <div class="facts">
      ${facts.map((fact) => `
        <div class="fact">
          <strong>${escapeHTML(fact[0])}</strong>
          <span>${escapeHTML(fact[1])}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function createMediaGrid(topic, topicIndex, media) {
  if (!media.length) {
    return `
      <div class="media-grid one">
        <div class="media-card is-error">
          <span class="media-label">SEM MÍDIA</span>
        </div>
      </div>
    `;
  }

  const gridClass = getMediaGridClass(media.length);

  return `
    <div class="media-grid ${gridClass}">
      ${media.map((item, mediaIndex) =>
        createMediaCard(topic, topicIndex, item, mediaIndex)
      ).join("")}
    </div>
  `;
}

function getMediaGridClass(quantity) {
  if (quantity === 1) return "one";
  if (quantity === 2) return "two";
  if (quantity === 3) return "three";
  if (quantity === 4) return "four";
  if (quantity === 5) return "five";
  return "five";
}

function createMediaCard(topic, topicIndex, media, mediaIndex) {
  const label = media.type === "video"
    ? "VÍDEO"
    : `IMAGEM ${mediaIndex + 1}`;

  if (media.type === "video") {
    return `
      <button
        class="media-card"
        type="button"
        data-topic="${topicIndex}"
        data-media="${mediaIndex}"
        aria-label="Abrir vídeo"
      >
        <span class="media-label">${label}</span>

        <video
          src="assets/media/${encodeURIComponent(media.file)}"
          preload="metadata"
          muted
          playsinline
          onerror="handleMediaError(this)"
        ></video>

        <span class="video-placeholder">
          <span class="play">▶</span>
          <strong>Visualizar vídeo</strong>
          <small>O conteúdo será aberto em tela ampliada.</small>
        </span>
      </button>
    `;
  }

  return `
    <button
      class="media-card"
      type="button"
      data-topic="${topicIndex}"
      data-media="${mediaIndex}"
      aria-label="Abrir imagem ${mediaIndex + 1}"
    >
      <span class="media-label">${label}</span>

      <img
        src="assets/media/${encodeURIComponent(media.file)}"
        alt="${escapeHTML(topic.title)} — imagem ${mediaIndex + 1}"
        loading="lazy"
        onerror="handleMediaError(this)"
      >
    </button>
  `;
}

function handleMediaError(element) {
  const card = element.closest(".media-card");

  if (card) {
    card.classList.add("is-error");
  }
}

function bindMediaButtons() {
  $$(".media-card").forEach((button) => {
    button.addEventListener("click", () => {
      openMedia(
        Number(button.dataset.topic),
        Number(button.dataset.media)
      );
    });
  });
}

function goTo(index) {
  if (!state.topics.length) return;

  const safeIndex = Math.max(
    0,
    Math.min(state.topics.length - 1, index)
  );

  state.current = safeIndex;
  updateCounter();

  const target = document.querySelector(`#topic-${safeIndex}`);

  if (target) {
    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function updateCounter() {
  const total = state.topics.length;
  const current = state.current + 1;

  const counter = $("#topicIndex");

  if (counter) {
    counter.textContent =
      `${String(current).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  }

  $$(".strategy-card").forEach((card, index) => {
    card.classList.toggle("active", index === state.current);
  });
}

function setupObserver() {
  const topics = $$(".topic");

  if (!topics.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const index = Number(entry.target.dataset.index);

        state.current = index;
        updateCounter();

        $$(".topic").forEach((topic) => {
          topic.classList.toggle(
            "is-active",
            Number(topic.dataset.index) === index
          );
        });
      });
    },
    {
      threshold: 0.48
    }
  );

  topics.forEach((topic) => observer.observe(topic));
}

function filterSearch(value) {
  const query = value.trim().toLowerCase();

  $$(".strategy-card").forEach((card, index) => {
    const topic = state.topics[index];

    const content = [
      topic.title,
      topic.category,
      topic.summary,
      ...(topic.facts || []).flat()
    ].join(" ").toLowerCase();

    card.classList.toggle(
      "hidden",
      Boolean(query) && !content.includes(query)
    );
  });

  $$(".topic").forEach((topic) => {
    const content = topic.dataset.search || "";

    topic.classList.toggle(
      "hidden",
      Boolean(query) && !content.includes(query)
    );
  });
}

function openMedia(topicIndex, mediaIndex) {
  const topic = state.topics[topicIndex];

  if (!topic || !topic.media || !topic.media.length) return;

  state.media = topic.media;
  state.mediaIndex = mediaIndex;
  state.currentTopicForLightbox = topicIndex;

  renderLightbox();

  const lightbox = $("#lightbox");

  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function renderLightbox() {
  const media = state.media[state.mediaIndex];
  const topic = state.topics[state.currentTopicForLightbox];

  if (!media || !topic) return;

  const content = $("#lightboxContent");

  if (media.type === "video") {
    content.innerHTML = `
      <video
        src="assets/media/${encodeURIComponent(media.file)}"
        controls
        autoplay
        playsinline
      ></video>
    `;
  } else {
    content.innerHTML = `
      <img
        src="assets/media/${encodeURIComponent(media.file)}"
        alt="${escapeHTML(topic.title)}"
      >
    `;
  }

  $("#lightboxCaption").textContent =
    `${topic.title} · ${
      media.type === "video"
        ? "Vídeo"
        : `Imagem ${state.mediaIndex + 1}`
    }`;
}

function moveMedia(direction) {
  if (!state.media.length) return;

  state.mediaIndex =
    (state.mediaIndex + direction + state.media.length) %
    state.media.length;

  renderLightbox();
}

function closeLightbox() {
  const lightbox = $("#lightbox");

  if (!lightbox) return;

  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");

  $("#lightboxContent").innerHTML = "";
  document.body.style.overflow = "";
}

function bindEvents() {
  $("#startBtn")?.addEventListener("click", () => {
    document.querySelector("#snapshot")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  $("#prevBtn")?.addEventListener("click", () => {
    goTo(Math.max(0, state.current - 1));
  });

  $("#nextBtn")?.addEventListener("click", () => {
    goTo(Math.min(state.topics.length - 1, state.current + 1));
  });

  $("#searchBtn")?.addEventListener("click", () => {
    const panel = $("#searchPanel");

    panel?.classList.toggle("open");

    if (panel?.classList.contains("open")) {
      $("#searchInput")?.focus();
    }
  });

  $("#clearSearch")?.addEventListener("click", () => {
    const input = $("#searchInput");

    if (!input) return;

    input.value = "";
    filterSearch("");
    input.focus();
  });

  $("#searchInput")?.addEventListener("input", (event) => {
    filterSearch(event.target.value);
  });

  $("#fullscreenBtn")?.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.warn("Fullscreen não disponível.", error);
    }
  });

  $("#lightboxClose")?.addEventListener("click", closeLightbox);

  $("#lightPrev")?.addEventListener("click", () => {
    moveMedia(-1);
  });

  $("#lightNext")?.addEventListener("click", () => {
    moveMedia(1);
  });

  $(".lightbox-backdrop")?.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", handleKeyboard);
}

function handleKeyboard(event) {
  if ($("#lightbox")?.classList.contains("open")) {
    if (event.key === "Escape") {
      closeLightbox();
      return;
    }

    if (event.key === "ArrowRight") {
      moveMedia(1);
      return;
    }

    if (event.key === "ArrowLeft") {
      moveMedia(-1);
      return;
    }
  }

  if (event.key === "ArrowRight") {
    goTo(Math.min(state.topics.length - 1, state.current + 1));
  }

  if (event.key === "ArrowLeft") {
    goTo(Math.max(0, state.current - 1));
  }
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
