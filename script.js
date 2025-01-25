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

function updateGridItem(item, gridItem) {
  const title = item.wbTitle ? item.wbTitle : item.title;
  const url = item.wbUrl ? item.wbUrl : item.url;
  gridItem.className = `grid-item ${item.class}`;
  gridItem.innerHTML = `<a href="${url}" target="_blank"><p>${title}</p></a>`;
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
  const i = data.info;
  detailsText.innerHTML = `
    <p>Title: <span>${i.title}</span></p>
    <p>Channel: <span>${i.channel}</span></p>
    <p>Published: <span>${i.date}</span></p>
    <p>Total: <span>${i.total}</span> 
    | Deleted: <span>${i.deleted}</span> 
    | Private: <span>${i.private}</span> 
    ${i.snapshot ? `| Snapshot: <span>${i.snapshot}</span>` : ""}
    ${i.lost ? `| Lost: <span>${i.lost}</span>` : ""}
    </p><a href="${i.url}" target="_blank">View playlist on Youtube</a>
    `;
}

async function loadLoader() {
  const loader = document.getElementById("loader");
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
    await delay(0);
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
      try {
        const data = await fetchPlaylist(api, id);
        output.innerHTML = "";
        loader.classList.add("visible");
        const items = await fetchPlaylistItems(api, id);
        const formattedData = formatPlaylistData(data, items);
        loader.classList.remove("visible");
        togglePanel(panelHeader, panelBody);
        // printItems(formattedData);
      } catch (e) {
        loader.classList.remove("visible");
        console.error("Error occurred:", e);
        alert(`Error: ${e.message || "Something went wrong"}`);
      }
    }
  });
}

async function fetchPlaylist(key, id) {
  console.log("Sending to backend with query parameter:", id);
  const url = `/.netlify/functions/fetchPlaylist?id=${encodeURIComponent(id)}`;
  const response = await fetch(url + id);
  data = await response.json();
  console.log(data);
}

async function fetchPlaylistItems(key, playlistId) {
  console.log("send to backend");
  return [];

  // const url = "https://www.googleapis.com/youtube/v3/playlistItems?";
  // const params = new URLSearchParams({
  //   key,
  //   playlistId,
  //   part: "snippet",
  //   maxResults: 50,
  // });

  // let items = [];
  // let next = "";

  // do {
  //   const apiUrl = url + params;
  //   const response = await fetch(apiUrl);
  //   const data = await response.json();

  //   items.push(...data.items);
  //   next = data.nextPageToken;
  //   params.set("pageToken", next);
  // } while (next);
  // return items;
}

function formatPlaylistData(data, items) {
  // items = items.slice(0, 20);
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
    updateGridItem(item, gridItem);
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
    let uncheckedCount = 0;
    let snapshotsFound = 0;
    let titlesFound = 0;
    let failedCount = 0;

    info.deleted = 0;
    info.private = 0;
    info.snapshot = 0;
    info.lost = 0;

    for (let i = 0, j = 0; i < items.length; i++) {
      const item = items[i];
      const gridItem = gridItems[i];

      if (item.class == "deleted" || item.class == "private") {
        j++;
        findMissingBtn.innerHTML = `Searching... ${j} of ${missingItemsCount} checked`;
        console.log(`\nSearching... ${j} of ${missingItemsCount} checked`);

        gridItem.className = `grid-item checking`;
        gridItem.innerHTML = "<a><p>Checking...</p></a>";

        let snapshot;
        if (!item.wayback) {
          try {
            snapshot = await findSnapshot(item);
          } catch (e) {
            console.error(e.message);
            failedCount++;
          }

          if (snapshot) {
            checkedCount++;
            item.wayback = snapshot;
            if (snapshot.length) {
              findMissingBtn.innerHTML = `Searching... ${j} of ${missingItemsCount} checked<br>Snapshot found, attempting to fetch title...`;
              console.log("Snapshot found: ", snapshot);
              snapshotsFound++;
              gridItem.innerHTML = "<a><p>Fetching title...</p></a>";

              const timestamp = snapshot[1][0];
              const proxyUrl = "https://api.codetabs.com/v1/proxy?quest=";
              item.wbUrl = `https://web.archive.org/web/${timestamp}/${item.url}`;

              let title;
              try {
                title = await getTitleFromLink(proxyUrl + item.wbUrl);
              } catch (e) {
                console.error(e.message);
              }

              if (title) {
                item.wbTitle = title;
                titlesFound++;
              } else {
                item.wbTitle = "Unknown Title";
              }

              item.class = "snapshot";
              console.log("title: ", item.wbTitle);
              updateGridItem(item, gridItem);
            } else {
              info.lost++;
              item.wbTitle = "Lost to Time...";
              item.class = "snapshot-empty";
              console.log("Snapshot Empty");
              updateGridItem(item, gridItem);
            }
          } else {
            uncheckedCount++;
            updateGridItem(item, gridItem);
          }
        } else {
          checkedCount++;
          updateGridItem(item, gridItem);
        }
        updateGridItem(item, gridItem);
      }

      if (item.class === "deleted") info.deleted++;
      if (item.class === "private") info.private++;
      if (item.class === "snapshot") info.snapshot++;
    }

    localStorage.setItem("playlistData", JSON.stringify({ info, items }));
    console.log("Data saved to local storage");

    findMissingBtn.classList.remove("searching");
    findMissingBtn.disabled = false;
    findMissingBtn.innerHTML = `
    <p><strong>Scan Complete</strong></p>
    <p>Scanned: ${checkedCount}, Failures: ${failedCount} (Scan again to retry failures)</p>
    <p>Snapshots Found: ${snapshotsFound} (Titles: ${titlesFound}), Lost to Time: ${info.lost}</p>
  `;

    data.info = info;
    updateDetailsText(detailsText, data);
  });

  requestAnimationFrame(async () => {
    details.style.opacity = 1;
    details.style.transform = "translateY(0px)";
    await delay(200);
    gridWrapper.style.opacity = 1;
    gridWrapper.style.transform = "translateY(0px)";
  });
}

async function findSnapshot(item) {
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
    throw new Error("Failed to reach Wayback Machine");
  }

  return await response.json();
}

async function getTitleFromLink(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch title");
  }

  const text = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");
  const cleanTitle = doc.title.replace("- YouTube", "").trim();

  if (
    cleanTitle &&
    cleanTitle !== "YouTube" &&
    cleanTitle !== "Wayback Machine" &&
    cleanTitle !== "400 Bad Request"
  ) {
    return cleanTitle;
  }
}

async function delay(time) {
  await new Promise((resolve) => setTimeout(resolve, time));
}

async function run() {
  const elements = getElements();
  const { api, id } = prepareParamsForm(elements.fetchBtn);
  const loader = await loadLoader();
  updateParamsDisplay(elements.params, api, id);
  addEventListeners(elements, loader, api, id);
  const localData = JSON.parse(localStorage.getItem("playlistData"));

  if (localData && localData.info.id == id) {
    printItems(localData);
    togglePanel(elements.panelHeader, elements.panelBody);
  }

  //// HELP FRAME - Move to seperate function
  const help = document.getElementById("help");
  const helpClose = document.getElementById("help-close");
  const helpOpen = document.getElementById("help-open");
  helpOpen.addEventListener("click", () => {
    help.style.display = "block";
    requestAnimationFrame(() => {
      help.style.opacity = 1;
    });
  });

  helpClose.addEventListener("click", () => {
    help.style.opacity = 0;
    help.addEventListener(
      "transitionend",
      () => {
        help.style.display = "none";
      },
      { once: true }
    );
  });
  //////////////////////////////////////////////
}

run();
