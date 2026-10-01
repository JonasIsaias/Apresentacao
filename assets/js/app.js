/* ============================================================
   HELPERS
============================================================ */

const $ = (selector) => {
  return document.querySelector(selector);
};


const $$ = (selector) => {
  return [...document.querySelectorAll(selector)];
};



/* ============================================================
   STATE
============================================================ */

const state = {

  data: null,

  current: 0,

  media: [],

  mediaIndex: 0,

  currentTopicForLightbox: 0

};



/* ============================================================
   INIT
============================================================ */

async function init() {

  try {

    const response = await fetch("assets/data.json");

    if (!response.ok) {
      throw new Error("Não foi possível carregar data.json");
    }

    state.data = await response.json();

    renderOverview();

    renderTopics();

    bindEvents();

    updateCounter();

  } catch (error) {

    console.error(error);

    const topicList = $("#topicList");

    if (topicList) {

      topicList.innerHTML = `
        <div class="topic">
          <div class="topic-top">
            <div class="topic-title">
              <span class="eyebrow">
                ERRO
              </span>

              <h3>
                Não foi possível carregar o conteúdo.
              </h3>

              <p>
                Verifique se o arquivo
                <strong>assets/data.json</strong>
                está no local correto.
              </p>
            </div>
          </div>
        </div>
      `;

    }

  }

}



/* ============================================================
   OVERVIEW
============================================================ */

function renderOverview() {

  const grid = $("#overviewGrid");

  if (!grid) {
    return;
  }


  grid.innerHTML = state.data.topics
    .map((topic, index) => {

      return `

        <button
          class="overview-card"
          data-go="${index}"
          type="button"
        >

          <span class="num">
            ${String(index + 1).padStart(2, "0")}
          </span>


          <div>

            <h3>
              ${escapeHTML(topic.title)}
            </h3>

            <p>
              ${escapeHTML(topic.category)}
            </p>

          </div>

        </button>

      `;

    })
    .join("");


  $("#overviewCounter").textContent =
    `${state.data.topics.length} temas`;


  $$(".overview-card").forEach((button) => {

    button.addEventListener("click", () => {

      const index =
        Number(button.dataset.go);

      goTo(index);

    });

  });

}



/* ============================================================
   TOPICS
============================================================ */

function renderTopics() {

  const topicList = $("#topicList");

  if (!topicList) {
    return;
  }


  topicList.innerHTML =
    state.data.topics
      .map((topic, index) => {

        const mediaClass =
          getMediaGridClass(topic.media.length);


        const mediaHTML =
          topic.media
            .map((media, mediaIndex) => {

              return createMediaCard(
                topic,
                index,
                media,
                mediaIndex
              );

            })
            .join("");


        const factsHTML =
          createFacts(topic.facts);


        return `

          <article
            class="topic"
            id="topic-${index}"
            data-search="
              ${escapeHTML(
                `${topic.title} ${topic.category} ${topic.summary}`
              ).toLowerCase()}
            "
          >

            <div class="topic-top">

              <div class="topic-title">

                <span class="eyebrow">
                  ${escapeHTML(topic.category)}
                </span>

                <h3>
                  ${escapeHTML(topic.title)}
                </h3>

                <p>
                  ${escapeHTML(topic.summary)}
                </p>

              </div>


              <div class="topic-meta">

                ${String(index + 1).padStart(2, "0")}
                /
                ${String(state.data.topics.length).padStart(2, "0")}

              </div>

            </div>


            <div class="media-grid ${mediaClass}">

              ${mediaHTML}

            </div>


            ${factsHTML}

          </article>

        `;

      })
      .join("");


  bindMediaButtons();

}



/* ============================================================
   MEDIA GRID CLASS
============================================================ */

function getMediaGridClass(quantity) {

  if (quantity === 1) {
    return "one";
  }

  if (quantity === 2) {
    return "two";
  }

  if (quantity === 3) {
    return "three";
  }

  if (quantity === 4) {
    return "four";
  }

  if (quantity === 5) {
    return "five";
  }

  return "eight";

}



/* ============================================================
   CREATE MEDIA CARD
============================================================ */

function createMediaCard(
  topic,
  topicIndex,
  media,
  mediaIndex
) {

  const label =
    media.type === "video"
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

        <span class="media-label">
          ${label}
        </span>


        <video
          src="assets/media/${media.file}"
          preload="metadata"
          muted
          playsinline
        ></video>


        <span class="placeholder video-placeholder">

          <span class="play">
            ▶
          </span>

          <strong>
            Clique para reproduzir
          </strong>

          <small>
            O áudio permanece desligado
            até sua interação.
          </small>

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

      <span class="media-label">
        ${label}
      </span>


      <img
        src="assets/media/${media.file}"
        alt="${escapeHTML(topic.title)} — imagem ${mediaIndex + 1}"
        loading="lazy"
        onerror="handleImageError(this)"
      >


      <span
        class="placeholder"
        style="display:none"
      >

        <strong>
          IMAGEM ${mediaIndex + 1}
        </strong>

        <small>
          Substitua pelo arquivo de mídia em
          <br>
          <b>
            assets/media/${media.file}
          </b>
        </small>

      </span>

    </button>

  `;

}



/* ============================================================
   IMAGE ERROR
============================================================ */

function handleImageError(image) {

  image.style.display = "none";

  const placeholder =
    image.nextElementSibling;

  if (placeholder) {

    placeholder.style.display =
      "flex";

  }

}



/* ============================================================
   FACTS
============================================================ */

function createFacts(facts) {

  if (!facts || !facts.length) {

    return "";

  }


  return `

    <div class="topic-facts">

      ${facts
        .map((fact) => {

          return `

            <div class="fact">

              <strong>
                ${escapeHTML(fact[0])}
              </strong>

              <span>
                ${escapeHTML(fact[1])}
              </span>

            </div>

          `;

        })
        .join("")}

    </div>

  `;

}



/* ============================================================
   EVENTS
============================================================ */

function bindEvents() {

  /* HOME */

  $("#homeBtn")?.addEventListener(
    "click",
    () => {

      $("#home")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }
  );


  /* START */

  $("#startBtn")?.addEventListener(
    "click",
    () => {

      goTo(0);

    }
  );


  /* OVERVIEW */

  $("#overviewBtn")?.addEventListener(
    "click",
    () => {

      $("#overview")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }
  );


  /* PREVIOUS */

  $("#prevBtn")?.addEventListener(
    "click",
    () => {

      goTo(
        Math.max(
          0,
          state.current - 1
        )
      );

    }
  );


  /* NEXT */

  $("#nextBtn")?.addEventListener(
    "click",
    () => {

      goTo(
        Math.min(
          state.data.topics.length - 1,
          state.current + 1
        )
      );

    }
  );


  /* SEARCH */

  $("#searchBtn")?.addEventListener(
    "click",
    () => {

      const panel =
        $("#searchPanel");

      panel.classList.toggle("open");

      if (
        panel.classList.contains("open")
      ) {

        $("#searchInput")?.focus();

      }

    }
  );


  /* CLEAR SEARCH */

  $("#clearSearch")?.addEventListener(
    "click",
    () => {

      const input =
        $("#searchInput");

      input.value = "";

      filterSearch("");

      input.focus();

    }
  );


  /* SEARCH INPUT */

  $("#searchInput")?.addEventListener(
    "input",
    (event) => {

      filterSearch(
        event.target.value
      );

    }
  );


  /* FULLSCREEN */

  $("#fullscreenBtn")?.addEventListener(
    "click",
    async () => {

      try {

        if (!document.fullscreenElement) {

          await document.documentElement.requestFullscreen();

        } else {

          await document.exitFullscreen();

        }

      } catch (error) {

        console.warn(
          "Fullscreen não disponível.",
          error
        );

      }

    }
  );


  /* LIGHTBOX CLOSE */

  $("#lightboxClose")?.addEventListener(
    "click",
    closeLightbox
  );


  /* LIGHTBOX PREVIOUS */

  $("#lightPrev")?.addEventListener(
    "click",
    () => {

      moveMedia(-1);

    }
  );


  /* LIGHTBOX NEXT */

  $("#lightNext")?.addEventListener(
    "click",
    () => {

      moveMedia(1);

    }
  );


  /* BACKDROP */

  $(".lightbox-backdrop")?.addEventListener(
    "click",
    closeLightbox
  );


  /* KEYBOARD */

  document.addEventListener(
    "keydown",
    handleKeyboard
  );


  /* OBSERVER */

  setupIntersectionObserver();

}



/* ============================================================
   MEDIA BUTTONS
============================================================ */

function bindMediaButtons() {

  $$(".media-card").forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const topicIndex =
          Number(button.dataset.topic);

        const mediaIndex =
          Number(button.dataset.media);

        openMedia(
          topicIndex,
          mediaIndex
        );

      }
    );

  });

}



/* ============================================================
   INTERSECTION OBSERVER
============================================================ */

function setupIntersectionObserver() {

  const topics =
    $$(".topic");


  if (!topics.length) {
    return;
  }


  const observer =
    new IntersectionObserver(
      (entries) => {

        entries.forEach((entry) => {

          if (!entry.isIntersecting) {
            return;
          }


          const number =
            Number(
              entry.target.id.replace(
                "topic-",
                ""
              )
            );


          state.current =
            number;


          updateCounter();

        });

      },
      {
        threshold: 0.45
      }
    );


  topics.forEach((topic) => {

    observer.observe(topic);

  });

}



/* ============================================================
   NAVIGATION
============================================================ */

function goTo(index) {

  if (!state.data) {
    return;
  }


  index =
    Math.max(
      0,
      Math.min(
        state.data.topics.length - 1,
        index
      )
    );


  state.current =
    index;


  updateCounter();


  const target =
    document.querySelector(
      `#topic-${index}`
    );


  if (target) {

    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }

}



/* ============================================================
   COUNTER
============================================================ */

function updateCounter() {

  if (!state.data) {
    return;
  }


  const total =
    state.data.topics.length;


  const current =
    state.current + 1;


  const counter =
    $("#topicIndex");


  if (counter) {

    counter.textContent =
      `${String(current).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  }


  $$(".overview-card").forEach(
    (card, index) => {

      card.classList.toggle(
        "active",
        index === state.current
      );

    }
  );

}



/* ============================================================
   SEARCH
============================================================ */

function filterSearch(value) {

  const query =
    value
      .trim()
      .toLowerCase();


  $$(".topic").forEach((topic) => {

    const content =
      topic.dataset.search || "";


    const visible =
      !query ||
      content.includes(query);


    topic.classList.toggle(
      "hidden",
      !visible
    );

  });


  $$(".overview-card").forEach(
    (card, index) => {

      const topic =
        state.data.topics[index];


      const content =
        `${topic.title} ${topic.category} ${topic.summary}`
          .toLowerCase();


      const visible =
        !query ||
        content.includes(query);


      card.style.display =
        visible
          ? ""
          : "none";

    }
  );

}



/* ============================================================
   OPEN MEDIA
============================================================ */

function openMedia(
  topicIndex,
  mediaIndex
) {

  const topic =
    state.data.topics[topicIndex];


  if (!topic) {
    return;
  }


  state.media =
    topic.media || [];


  state.mediaIndex =
    mediaIndex;


  state.currentTopicForLightbox =
    topicIndex;


  renderLightbox();


  const lightbox =
    $("#lightbox");


  lightbox.classList.add(
    "open"
  );


  lightbox.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.style.overflow =
    "hidden";

}



/* ============================================================
   RENDER LIGHTBOX
============================================================ */

function renderLightbox() {

  const media =
    state.media[state.mediaIndex];


  const topic =
    state.data.topics[
      state.currentTopicForLightbox
    ];


  if (!media || !topic) {
    return;
  }


  const content =
    $("#lightboxContent");


  if (media.type === "video") {

    content.innerHTML = `

      <video
        src="assets/media/${media.file}"
        controls
        autoplay
        playsinline
      ></video>

    `;

  } else {

    content.innerHTML = `

      <img
        src="assets/media/${media.file}"
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



/* ============================================================
   MOVE MEDIA
============================================================ */

function moveMedia(direction) {

  if (!state.media.length) {
    return;
  }


  state.mediaIndex =
    (
      state.mediaIndex +
      direction +
      state.media.length
    ) %
    state.media.length;


  renderLightbox();

}



/* ============================================================
   CLOSE LIGHTBOX
============================================================ */

function closeLightbox() {

  const lightbox =
    $("#lightbox");


  lightbox.classList.remove(
    "open"
  );


  lightbox.setAttribute(
    "aria-hidden",
    "true"
  );


  $("#lightboxContent").innerHTML =
    "";


  document.body.style.overflow =
    "";

}



/* ============================================================
   KEYBOARD
============================================================ */

function handleKeyboard(event) {

  if (
    $("#lightbox")?.classList.contains("open")
  ) {

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

    goTo(
      Math.min(
        state.data.topics.length - 1,
        state.current + 1
      )
    );

  }


  if (event.key === "ArrowLeft") {

    goTo(
      Math.max(
        0,
        state.current - 1
      )
    );

  }

}



/* ============================================================
   ESCAPE HTML
============================================================ */

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}



/* ============================================================
   START
============================================================ */

init();