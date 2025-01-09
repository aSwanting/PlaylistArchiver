# YouTube Playlist Archiver

The YouTube Playlist Archiver is a web tool designed to help locate old, deleted, or private YouTube videos using archive.org's Wayback Machine. It scans a YouTube playlist, attempts to retrieve snapshots of videos, and fetches page titles that usually correspond to the video titles.

## Access the App

Use the app here:  
[YouTube Playlist Archiver](https://aswanting.github.io/PlaylistArchiver/)

## Requirements

- A **YouTube API Key** (get one from the [Google Cloud Console](https://console.cloud.google.com/)).
- The **Playlist ID** of the playlist you want to scan.

## Notes

- If some items fail during a scan, rescanning will only process the failed items.
- The app stores your API key, playlist ID, and scan data in your browser's local storage for convenience. These values are overwritten when new data is entered.
