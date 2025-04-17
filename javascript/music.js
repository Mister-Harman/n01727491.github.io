// Fetch random tracks from iTunes API
async function fetchRandomTracks() {
    const randomLetter = String.fromCharCode(97 + Math.floor(Math.random() * 26));
    const response = await fetch(`https://itunes.apple.com/search?term=${randomLetter}&media=music&entity=musicTrack&limit=10`);
    const data = await response.json();
    return data.results;
}

// Display tracks on the page with more details including duration and iTunes link
async function displayTracks() {
    const tracks = await fetchRandomTracks();
    const tracksContainer = document.getElementById('tracks');
    tracksContainer.innerHTML = '';

    tracks.forEach(track => {
        const durationMinutes = Math.floor(track.trackTimeMillis / 60000);
        const durationSeconds = ((track.trackTimeMillis % 60000) / 1000).toFixed(0);
        const itunesLink = track.trackViewUrl;

        const imageUrl = track.artworkUrl100 || 'https://via.placeholder.com/150';

        const trackElement = document.createElement('div');
        trackElement.innerHTML = `
            <div class="image-container">
                <img src="${imageUrl}" alt="${track.trackName}" width="150">
            </div>
            <h2>${track.trackName}</h2>
            <p>Artist: ${track.artistName}</p>
            <p>Album: ${track.collectionName}</p>
            <p>Release Date: ${track.releaseDate.split('T')[0]}</p>
            <p>Duration: ${durationMinutes}:${durationSeconds}</p>
            <p><a href="${itunesLink}" target="_blank">Listen on iTunes</a></p>
        `;
        tracksContainer.appendChild(trackElement);
    });
}

displayTracks();