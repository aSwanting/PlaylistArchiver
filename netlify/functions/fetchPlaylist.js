export async function handler(event) {
  const key = process.env.API_KEY;
  const { id } = event.queryStringParameters;

  const url = "https://www.googleapis.com/youtube/v3/playlists?";
  const params = new URLSearchParams({ key, id, part: "snippet" });
  const apiUrl = url + params;

  const response = await fetch(apiUrl);
  const data = await response.json();

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
}

// const url = "https://www.googleapis.com/youtube/v3/playlists?";
// const params = new URLSearchParams({ key, id, part: "snippet" });
// const apiUrl = url + params;

// let response;
// let data;

// try {
//   response = await fetch(apiUrl);
//   data = await response.json();
// } catch (error) {
//   throw new Error(
//     "Failed to fetch the playlist. Please check your connection."
//   );
// }

// if (!response.ok) {
//   const errorMessage =
//     data?.error?.message || `HTTP Error: ${response.status}`;
//   throw new Error(errorMessage);
// }

// if (data.items && data.items.length > 0) {
//   const details = data.items[0].snippet;
//   return details;
// } else {
//   throw new Error("The playlist is empty, private or does not exist.");
// }
