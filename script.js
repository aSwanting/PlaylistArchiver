function getElements() {
  return {
    panelHeader: document.getElementById("panel-header"),
    panelBody: document.getElementById("panel-body"),
    output: document.getElementById("output"),
    apiInput: document.getElementById("api-input"),
    idInput: document.getElementById("id-input"),
    apiBtn: document.getElementById("save-api"),
    idBtn: document.getElementById("save-id"),
    fetchBtn: document.getElementById("fetch-info"),
    params: document.getElementById("parameters"),
  };
}

function prepareParamsForm(fetchBtn) {
  const api = localStorage.getItem("api") || "";
  const id = localStorage.getItem("id") || "";
  fetchBtn.disabled = !(api && id);
  return { api, id };
}

function updateParamsDisplay(params, api, id) {
  let secretKey = "";
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

function updateDetailsText(detailsText, data) {
  detailsText.innerHTML = `
    <p>Title: <span>${data.info.title}</span></p>
    <p>Channel: <span>${data.info.channel}</span></p>
    <p>Published: <span>${data.info.date}</span></p>
    <p>Total: <span>${data.info.total}</span> 
    | Deleted: <span>${data.info.deleted}</span> 
    | Private: <span>${data.info.private}</span> 
    ${
      data.info.snapshot ? `| Snapshot: <span>${data.info.snapshot}</span>` : ""
    }
    </p><a href="${data.info.url}" target="_blank">View playlist on Youtube</a>
    `;
}

async function loadLoader() {
  const loader = document.querySelector(".loader");
  await fetch("./audio.svg")
    .then((response) => response.text())
    .then((data) => (loader.innerHTML = data));
  return loader;
}

async function togglePanel(panelHeader, panelBody) {
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

function saveItem(type, value, inputElement, params, api, id) {
  const existing = localStorage.getItem(type);
  if (existing && existing !== value) {
    if (!confirm(`Overwrite ${type.toUpperCase()}?`)) return false;
  }
  localStorage.setItem(type, value);
  inputElement.value = "";
  updateParamsDisplay(params, api, id);
  return true;
}

function addEventListeners(elements, loader, api, id) {
  const {
    panelHeader,
    panelBody,
    apiBtn,
    apiInput,
    idBtn,
    idInput,
    fetchBtn,
    params,
  } = elements;

  panelHeader.addEventListener("click", () => {
    togglePanel(panelHeader, panelBody);
  });

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
      saveItem("api", api, apiInput, params, api, id);
    } else {
      alert("Invalid API Key");
    }
  });

  idBtn.addEventListener("click", () => {
    if (id.length >= 8) {
      saveItem("id", id, idInput, params, api, id);
    } else {
      alert("Invalid Playlist ID");
    }
  });

  fetchBtn.addEventListener("click", async () => {
    if (
      saveItem("api", api, apiInput, params, api, id) &&
      saveItem("id", id, idInput, params, api, id)
    ) {
      output.innerHTML = "";
      togglePanel(panelHeader, panelBody);
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
  const params = new URLSearchParams({ key, id, part: "snippet" });
  const apiUrl = url + params;
  const response = await fetch(apiUrl);
  const data = await response.json();
  const details = data.items[0].snippet;
  return details;
}

async function fetchPlaylistItems(key, playlistId) {
  const url = "https://www.googleapis.com/youtube/v3/playlistItems?";
  const params = new URLSearchParams({
    key,
    playlistId,
    part: "snippet",
    maxResults: 50,
  });

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
  const formattedData = {
    info: {
      title: data.title,
      channel: data.channelTitle,
      description: data.description,
      id: items[0].snippet.playlistId,
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
  localStorage.setItem("playlistData", JSON.stringify(formattedData));
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

  updateDetailsText(detailsText, data);

  findMissingBtn.innerHTML = "Search for missing playlist items";

  for (const item of data.items) {
    const gridItem = document.createElement("div");
    gridItem.className = `grid-item ${item.class}`;
    gridItem.innerHTML = `<a href="${item.url}" target="_blank"><p>${item.title}</p></a>`;
    gridWrapperScroll.appendChild(gridItem);
  }

  findMissingBtn.addEventListener("click", async () => {
    findMissingBtn.disabled = true;
    findMissingBtn.innerHTML = "Searching... 0 of 0 checked";
    findMissingBtn.classList.add("searching");

    const gridItems = document.querySelectorAll(".grid-item");
    const localData = JSON.parse(localStorage.getItem("playlistData"));
    const info = localData ? localData.info : data.info;
    const items = localData ? localData.items : data.items;
    const missingItemsCount = info.deleted + info.private;

    let checkedCount = 0;
    let failedCount = 0;

    info.deleted = 0;
    info.private = 0;
    info.snapshot = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const gridItem = gridItems[i];
      if (item.class == "deleted" || item.class == "private") {
        gridItem.className = `grid-item checking`;
        gridItem.innerHTML = "<a><p>Checking...</p></a>";
        findMissingBtn.innerHTML = `Searching... ${checkedCount} of ${missingItemsCount} checked`;

        if (!item.wayback) {
          try {
            console.log(`Checking ${++checkedCount} of ${missingItemsCount}`);
            const proxyUrl = "https://api.codetabs.com/v1/proxy?quest=";
            const cdxUrl = "https://web.archive.org/cdx/search/cdx?";
            const params = new URLSearchParams({
              url: item.url,
              output: "json",
              sort: "ascending",
              limit: 1,
              fl: "timestamp,original,statuscode",
            });
            const apiUrl = proxyUrl + encodeURIComponent(cdxUrl + params);

            const response = await fetch(apiUrl);

            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const resData = await response.json();
            item.wayback = resData;

            if (resData.length) {
              console.log("Snapshot found:", resData);
              const timestamp = resData[1][0];
              item.title = "Snapshot";
              item.class = "snapshot";
              item.wbUrl = `https://web.archive.org/web/${timestamp}/${item.url}`;
              item.wbTitle = await getTitleFromLink(proxyUrl + item.wbUrl);
              gridItem.className = "grid-item snapshot";
              gridItem.innerHTML = `
                <a href="${item.wbUrl}" target="_blank">
                  <p>${item.wbTitle}</p>
                </a>
              `;
            } else {
              gridItem.className = `grid-item ${item.class}`;
              gridItem.innerHTML = `<a href="${item.url}" target="_blank"><p>${item.title}</p></a>`;
              console.log("No snapshot found");
            }
          } catch (error) {
            gridItem.className = `grid-item ${item.class}`;
            gridItem.innerHTML = `<a href="${item.url}" target="_blank"><p>${item.title}</p></a>`;
            console.error(`Error processing item ${i}:`, error);
            failedCount++;
          }
        }
      }

      if (item.class === "deleted") info.deleted++;
      if (item.class === "private") info.private++;
      if (item.class === "snapshot") info.snapshot++;
    }

    logResults(checkedCount, failedCount, info);

    localStorage.setItem("playlistData", JSON.stringify({ info, items }));
    console.log("Data saved to local storage");

    findMissingBtn.disabled = false;
    findMissingBtn.innerHTML = "Search for missing playlist items";
    findMissingBtn.classList.remove("searching");

    updateDetailsText(detailsText, data);
  });

  requestAnimationFrame(async () => {
    details.style.opacity = 1;
    details.style.transform = "translateY(0px)";
    await new Promise((resolve) => setTimeout(resolve, 200));
    gridWrapper.style.opacity = 1;
    gridWrapper.style.transform = "translateY(0px)";
  });
}

async function getTitleFromLink(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    return doc.title &&
      doc.title !== "YouTube" &&
      doc.title !== "Wayback Machine"
      ? doc.title
      : "Unknown Title";
  } catch (error) {
    console.error("Error fetching title:", error);
    return "Unknown Title";
  }
}

function logResults(checkedCount, failedCount, info) {
  console.log("Search completed");
  console.log("checked: ", checkedCount);
  console.log("failed scans: ", failedCount);
  console.log("deleted: ", info.deleted);
  console.log("private: ", info.private);
  console.log("snapshot: ", info.snapshot);
}

async function run() {
  const elements = getElements();
  const { api, id } = prepareParamsForm(elements.fetchBtn);
  const loader = await loadLoader();
  updateParamsDisplay(elements.params, api, id);
  addEventListeners(elements, loader, api, id);
  const localData = JSON.parse(localStorage.getItem("playlistData"));
  if (localData && localData.info.id == id) printItems(localData);
}

run();
