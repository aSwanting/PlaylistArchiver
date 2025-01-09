async function addEventListeners() {
  const panelHeader = document.getElementById("panel-header");
  const panelBody = document.getElementById("panel-body");
  const output = document.getElementById("output");
  const apiInput = document.getElementById("api-input");
  const idInput = document.getElementById("id-input");
  const apiBtn = document.getElementById("save-api");
  const idBtn = document.getElementById("save-id");
  const fetchBtn = document.getElementById("fetch-info");
  const params = document.getElementById("parameters");

  let api = localStorage.getItem("api") || "";
  let id = localStorage.getItem("id") || "";
  let secretKey = "";
  fetchBtn.disabled = !(api && id);

  const loader = document.querySelector(".loader");
  await fetch("./audio.svg")
    .then((response) => response.text())
    .then((data) => (loader.innerHTML = data));

  function updateParamsDisplay() {
    params.style.display = api || id ? "flex" : "none";
    if (api.length) {
      secretKey =
        api.slice(0, 3) +
        "******************" +
        api.slice(api.length - 3, api.length);
    }
    params.innerHTML = `
      <p>Api Key: <span>${secretKey}</span></p>
      <p>Playlist ID: <span>${id}</span></p>
    `;
  }

  function saveApi(api) {
    if (localStorage.getItem("api") && localStorage.getItem("api") !== api) {
      if (!confirm("Overwrite API?")) return false;
    }
    localStorage.setItem("api", api);
    apiInput.value = "";
    updateParamsDisplay();
    return true;
  }

  function saveId(id) {
    if (localStorage.getItem("id") && localStorage.getItem("id") !== id) {
      if (!confirm("Overwrite ID?")) return false;
    }
    localStorage.setItem("id", id);
    idInput.value = "";
    updateParamsDisplay();
    return true;
  }

  async function togglePanel() {
    const h = panelBody.scrollHeight;
    const p = 16;
    if (panelBody.style.height == "0px") {
      panelHeader.classList.remove("closed");
      panelBody.style.height = h + p * 2 + "px";
      panelBody.style.paddingBlock = p + "px";
      await new Promise((resolve) => {
        panelBody.addEventListener("transitionend", resolve, { once: true });
      });
      panelBody.style.height = "auto";
    } else {
      panelHeader.classList.add("closed");
      panelBody.style.height = h + "px";
      await new Promise((resolve) => setTimeout(resolve, 0));
      panelBody.style.height = "0px";
      panelBody.style.paddingBlock = 0 + "px";
    }
  }

  updateParamsDisplay();

  panelHeader.addEventListener("click", togglePanel);

  apiInput.addEventListener("input", () => {
    api = apiInput.value.trim();
    apiBtn.disabled = !api;
    fetchBtn.disabled = !(api && id);
  });

  idInput.addEventListener("input", () => {
    id = idInput.value.trim();
    idBtn.disabled = !id;
    fetchBtn.disabled = !(api && id);
  });

  apiBtn.addEventListener("click", () => {
    if (api.length >= 8) {
      saveApi(api);
    } else {
      alert("Invalid API Key");
    }
  });

  idBtn.addEventListener("click", () => {
    if (id.length >= 8) {
      saveId(id);
    } else {
      alert("Invalid Playlist ID");
    }
  });

  fetchBtn.addEventListener("click", async () => {
    if (saveApi(api) && saveId(id)) {
      output.innerHTML = "";
      togglePanel();
      loader.classList.add("visible");
      const data = await fetchPlaylist(api, id);
      const items = await fetchPlaylistItems(api, id);
      const formattedData = formatPlaylistData(data, items);
      loader.classList.remove("visible");
      printItems(formattedData);
    }
  });
}

async function fetchPlaylist(key, id) {
  const url = "https://www.googleapis.com/youtube/v3/playlists?";
  const part = "snippet";
  const params = new URLSearchParams({ key, id, part });
  const apiUrl = url + params;
  const response = await fetch(apiUrl);
  const data = await response.json();
  const details = data.items[0].snippet;
  return details;
}

async function fetchPlaylistItems(key, playlistId) {
  const url = "https://www.googleapis.com/youtube/v3/playlistItems?";
  const part = "snippet";
  const maxResults = 50;
  const params = new URLSearchParams({ key, playlistId, part, maxResults });

  let items = [];
  let next = "";

  do {
    const apiUrl = url + params;
    const response = await fetch(apiUrl);
    const data = await response.json();

    items.push(...data.items);
    next = data.nextPageToken;
    params.set("pageToken", next);
  } while (next);
  return items;
}

function formatPlaylistData(data, items) {
  console.log(data);
  console.log(items);
  const formattedData = {
    info: {
      title: data.title,
      channel: data.channelTitle,
      description: data.description,
      url: `https://www.youtube.com/playlist?list=${items[0].snippet.playlistId}`,
      date: new Date(data.publishedAt).toDateString(),
      total: items.length,
      deleted: items.filter((e) => e.snippet.title == "Deleted video").length,
      private: items.filter((e) => e.snippet.title == "Private video").length,
    },
    items: items.map((e) => {
      return {
        title: e.snippet.title,
        channel: e.snippet.videoOwnerChannelTitle,
        videoId: e.snippet.resourceId.videoId,
        url: `https://www.youtube.com/watch?v=${e.snippet.resourceId.videoId}`,
        class:
          e.snippet.title == "Deleted video"
            ? "deleted"
            : e.snippet.title == "Private video"
            ? "private"
            : "",
      };
    }),
  };

  return formattedData;
}

async function printItems(data) {
  const output = document.getElementById("output");

  const details = document.createElement("div");
  const detailsText = document.createElement("div");
  const controls = document.createElement("div");
  const findMissingBtn = document.createElement("button");

  const gridWrapper = document.createElement("div");
  const gridWrapperScroll = document.createElement("div");

  details.className = "details anim-in";
  detailsText.className = "details-text";
  controls.className = "details-controls";

  gridWrapper.className = "grid-wrapper anim-in";
  gridWrapperScroll.className = "grid-wrapper-scroll";

  output.appendChild(details);
  details.appendChild(detailsText);
  details.appendChild(controls);
  controls.appendChild(findMissingBtn);

  output.appendChild(gridWrapper);
  gridWrapper.appendChild(gridWrapperScroll);

  detailsText.innerHTML = `
  <p>Title: <span>${data.info.title}</span></p>
  <p>Channel: <span>${data.info.channel}</span></p>
  <p>Published: <span>${data.info.date}</span></p>
  <p>Total: <span>${data.info.total}</span> | Deleted: <span>${data.info.deleted}</span> | Private: <span>${data.info.private}</span></p>
  <a href="${data.info.url}" target="_blank">View playlist on Youtube</a>
  `;

  findMissingBtn.innerHTML = "Search for missing playlist items";
  findMissingBtn.addEventListener("click", async () => {
    const missingItems = data.items.filter((e) => {
      return e.class == "deleted" || e.class == "private";
    });
    console.log(missingItems);
    for (item of missingItems) {
      const proxyUrl = "https://thingproxy.freeboard.io/fetch/";
      const cdxUrl = "https://web.archive.org/cdx/search/cdx?";
      const url = item.url;
      const output = "json";
      const sort = "ascending";
      const limit = 1;
      const params = new URLSearchParams({ url, output, sort, limit });
      const apiUrl = proxyUrl + cdxUrl + params;
      const response = await fetch(apiUrl);
      const data = await response.text();
      console.log("TEXT RES", data);
    }
  });

  for (const item of data.items) {
    const gridItem = document.createElement("div");
    gridItem.className = `grid-item ${item.class}`;
    gridItem.innerHTML = `<a href="${item.url}" target="_blank"><p>${item.title}</p></a>`;
    gridWrapperScroll.appendChild(gridItem);
  }

  requestAnimationFrame(async () => {
    details.style.opacity = 1;
    details.style.transform = "translateY(0px)";

    await new Promise((resolve) => setTimeout(resolve, 200));

    gridWrapper.style.opacity = 1;
    gridWrapper.style.transform = "translateY(0px)";
  });
}

async function run() {
  addEventListeners();
}

run();
