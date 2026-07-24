(() => {
  "use strict";

  // Standalone concept data. Nothing on the current television page imports this file.
  const channels = [
    {
      id: "inner-planes",
      name: "Inner Planes",
      subtitle: "sunrise ambient",
      formats: {
        videos: {
          artist: "Flume feat. Beck",
          programme: "Tiny Cities",
          media: "a s s e t s/Flume - Tiny Cities feat. Beck.mp4",
          previewTime: 10,
        },
        parties: {
          artist: "Ben Böhmer",
          programme: "Live above Cappadocia",
          media: "a s s e t s/d j  s e t s/Ben Böhmer live - Cappadocia, Turkey - Cercle.mp4",
          previewTime: 145,
        },
        radio: {
          artist: "NTS",
          programme: "Slow Focus",
          media: "a s s e t s/Björk - Hyperballad.mp4",
          previewTime: 42,
        },
      },
    },
    {
      id: "champagne-bohemia",
      name: "Champagne Bohemia",
      subtitle: "sunset Balearic",
      formats: {
        videos: {
          artist: "Solange",
          programme: "Cranes in the Sky",
          media: "a s s e t s/Solange - Cranes in the Sky.mp4",
          previewTime: 54,
        },
        parties: {
          artist: "Sasha",
          programme: "Ibiza Boat at Sunset",
          media: "a s s e t s/d j  s e t s/ Sasha - Ibiza Boat at Sunset - Freqways.mp4",
          previewTime: 165,
        },
        radio: {
          artist: "NTS",
          programme: "Poolside",
          media: "a s s e t s/Tame Impala - The Less I Know The Better.mp4",
          previewTime: 37,
        },
      },
    },
    {
      id: "modul8-infinity",
      name: "modul8 infinity",
      subtitle: "rave × mindfulness",
      formats: {
        videos: {
          artist: "The Prodigy",
          programme: "Everybody in the Place",
          media: "a s s e t s/The Prodigy - Everybody In The Place.mp4",
          previewTime: 28,
        },
        parties: {
          artist: "Carl Cox",
          programme: "Château de Chambord",
          media: "a s s e t s/d j  s e t s/Carl Cox - Château de Chambord, France - Cercle.mp4",
          previewTime: 158,
        },
        radio: {
          artist: "Café del Mar Radio",
          programme: "House",
          media: "a s s e t s/Madonna - Ray Of Light.mp4",
          previewTime: 46,
        },
      },
    },
    {
      id: "james-bondage",
      name: "james bondage",
      subtitle: "sex × mindfulness",
      formats: {
        videos: {
          artist: "Grimes",
          programme: "Genesis",
          media: "a s s e t s/Grimes - Genesis.mp4",
          previewTime: 36,
        },
        parties: {
          artist: "Nina Kraviz",
          programme: "Eiffel Tower, Paris",
          media: "a s s e t s/d j  s e t s/Nina Kraviz - Eiffel Tower, Paris, France - Cercle.mp4",
          previewTime: 170,
        },
        radio: {
          artist: "Sanctuary Radio",
          programme: "Dark Electro",
          media: "a s s e t s/U2 - Numb.mp4",
          previewTime: 31,
        },
      },
    },
  ];

  const formatLabels = {
    videos: "Videos",
    parties: "Parties",
    radio: "Radio",
  };

  const grid = document.querySelector("[data-channel-grid]");
  const shelf = document.querySelector("[data-channel-shelf]");
  const backgroundImage = document.querySelector("[data-background-image]");
  const formatTitle = document.querySelector("[data-format-title]");
  const currentChannel = document.querySelector("[data-current-channel]");
  const currentCount = document.querySelector("[data-current-count]");
  const formatButtons = Array.from(document.querySelectorAll("[data-format]"));
  const shelfClose = document.querySelector("[data-shelf-close]");
  const shelfOpen = document.querySelector("[data-shelf-open]");
  const previousButton = document.querySelector("[data-channel-previous]");
  const nextButton = document.querySelector("[data-channel-next]");

  let activeFormat = "videos";
  let activeIndex = 0;

  function formatItem(channel) {
    return channel.formats[activeFormat];
  }

  function thumbnailUrl(item, height = 720) {
    const asset = window.IAMCloudflareStream?.assetFor(item.media);
    if (!asset) return "";
    return `https://${window.IAMCloudflareStream.customerHost}/${asset.uid}/thumbnails/thumbnail.jpg?time=${item.previewTime}s&height=${height}`;
  }

  function renderCards() {
    grid.innerHTML = channels.map((channel, index) => {
      const item = formatItem(channel);
      const selected = index === activeIndex;
      const context = selected
        ? `Based on your check-in · ${channel.subtitle}`
        : `${channel.subtitle} · on now`;

      return `
        <article class="channel-card" role="listitem">
          <button
            class="channel-card__button"
            type="button"
            data-channel-index="${index}"
            aria-pressed="${selected}"
            aria-label="Join ${channel.name}. ${channel.subtitle}. Now playing ${item.artist}, ${item.programme}."
          >
            <span class="channel-card__media">
              <img src="${thumbnailUrl(item, 420)}" alt="" loading="eager" aria-hidden="true">
              <span class="channel-card__badge channel-card__badge--live">on now</span>
              <span class="channel-card__badge channel-card__badge--channel">${channel.name}</span>
              ${selected ? '<span class="channel-card__preview">10s preview</span>' : ""}
            </span>
            <span class="channel-card__copy">
              <span class="channel-card__context">${context}</span>
              <span class="channel-card__artist">${item.artist}</span>
              <span class="channel-card__programme">${item.programme}</span>
            </span>
          </button>
        </article>
      `;
    }).join("");

    grid.querySelectorAll("[data-channel-index]").forEach((button) => {
      button.addEventListener("click", () => {
        activeIndex = Number(button.dataset.channelIndex || 0);
        render();
      });
    });
  }

  function updateBackground() {
    const item = formatItem(channels[activeIndex]);
    const nextMedia = thumbnailUrl(item, 1080);
    backgroundImage.classList.add("is-switching");

    const reveal = () => {
      backgroundImage.classList.remove("is-switching");
    };

    if (backgroundImage.getAttribute("src") === nextMedia) {
      reveal();
      return;
    }

    backgroundImage.addEventListener("load", reveal, { once: true });
    backgroundImage.src = nextMedia;
  }

  function updateControls() {
    const channel = channels[activeIndex];
    formatTitle.textContent = formatLabels[activeFormat];
    currentChannel.textContent = channel.name;
    currentCount.textContent = `${activeIndex + 1} / ${channels.length}`;
    shelfOpen.setAttribute("aria-label", `Open ${formatLabels[activeFormat]} shared channels. Current channel: ${channel.name}`);

    formatButtons.forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.format === activeFormat));
    });
  }

  function render() {
    renderCards();
    updateControls();
    updateBackground();
  }

  function chooseRelativeChannel(direction) {
    activeIndex = (activeIndex + direction + channels.length) % channels.length;
    render();
  }

  formatButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFormat = button.dataset.format || "videos";
      render();
    });
  });

  previousButton.addEventListener("click", () => chooseRelativeChannel(-1));
  nextButton.addEventListener("click", () => chooseRelativeChannel(1));

  shelfClose.addEventListener("click", () => {
    shelf.setAttribute("aria-hidden", "true");
    shelfOpen.setAttribute("aria-expanded", "false");
    shelfOpen.focus({ preventScroll: true });
  });

  shelfOpen.addEventListener("click", () => {
    shelf.removeAttribute("aria-hidden");
    shelfOpen.setAttribute("aria-expanded", "true");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && shelf.getAttribute("aria-hidden") !== "true") {
      shelfClose.click();
    }
  });

  render();
})();
