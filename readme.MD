# YouTube Playlist Archiver

The YouTube Playlist Archiver is a web tool that scans a YouTube playlist to retrieve information about its videos. It's simple to use and automatically keeps track of items that fail during the scan.

## Access the App

Use the app here:  
[YouTube Playlist Archiver](https://aswanting.github.io/PlaylistArchiver/)

## Requirements

- A **YouTube API Key** (get one from the [Google Cloud Console](https://console.cloud.google.com/)).
- The **Playlist ID** of the playlist you want to scan.

## How It Works

1. Enter your **YouTube API Key** and **Playlist ID**.
2. Click "Scan" to start scanning the playlist.
3. If some items fail to scan, rescanning will only process the failed items.

### Local Storage

- The app stores your API key, playlist ID, and scan data in your browser for convenience.
- These values are overwritten when you reenter the API key or playlist ID.
