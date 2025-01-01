function addEventListeners() {
  const apiInput = document.getElementById("api-input");
  const idInput = document.getElementById("id-input");
  const apiBtn = document.getElementById("save-api");
  const idBtn = document.getElementById("save-id");
  const fetchBtn = document.getElementById("fetch-info");
  const params = document.getElementById("parameters");

  let api = localStorage.getItem("api") || "";
  let id = localStorage.getItem("id") || "";
  fetchBtn.disabled = !(api && id);

  function updateParamsDisplay() {
    params.style.display = api || id ? "flex" : "none";
    params.innerHTML = `
      <p>Api Key: <span>${api}</span></p>
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

  updateParamsDisplay();

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
    saveApi(api);
  });

  idBtn.addEventListener("click", () => {
    saveId(id);
  });

  fetchBtn.addEventListener("click", async () => {
    if (saveApi(api) && saveId(id)) {
      const items = await fetchPlaylist(api, id);
      console.log(items);
      if (items) printItems(items, id);
    }
  });
}

async function fetchPlaylist(key, playlistId) {
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
    items.push(
      ...data.items.map((e) => {
        return {
          title: e.snippet.title,
          channel: e.snippet.videoOwnerChannelTitle,
          videoId: e.snippet.resourceId.videoId,
        };
      })
    );
    next = data.nextPageToken;
    params.set("pageToken", next);
  } while (next);
  return items;
}

function printItems(items, playlistId) {
  let itemCount = items.length;
  let deletedCount = 0;
  let privateCount = 0;

  const app = document.getElementById("output");
  const header = document.createElement("div");
  const playlistLink = document.createElement("a");
  const gridWrapper = document.createElement("div");
  const counter = document.createElement("div");

  app.appendChild(header);
  app.appendChild(counter);
  app.appendChild(gridWrapper);
  header.appendChild(playlistLink);

  header.className = "header";
  counter.className = "counter";
  gridWrapper.className = "grid-wrapper";

  playlistLink.href = `https://www.youtube.com/playlist?list=${playlistId}`;
  playlistLink.innerText = "View Playlist on YouTube";
  playlistLink.target = "_blank";

  for (const item of items) {
    const gridItem = document.createElement("div");
    gridWrapper.appendChild(gridItem);

    gridItem.className = "grid-item";
    gridItem.innerHTML = `
      <a href="https://www.youtube.com/watch?v=${item.videoId}" target="_blank">
        <p>${item.title}</p>
      </a>
    `;

    if (item.title == "Deleted video") {
      gridItem.classList.add("deleted");
      deletedCount++;
    }

    if (item.title == "Private video") {
      gridItem.classList.add("private");
      privateCount++;
    }
  }

  counter.innerHTML = `Total: ${itemCount} | Deleted: ${deletedCount} | Private: ${privateCount}`;
}

async function run() {
  addEventListeners();
}

run();
