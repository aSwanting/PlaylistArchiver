export async function handler(event) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello from Netlify Functions!",
      input: event.queryStringParameters || {},
      apiKey: process.env.API_KEY,
    }),
  };
}

async function fetchPlaylist(key, id) {
  return "hi";
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
