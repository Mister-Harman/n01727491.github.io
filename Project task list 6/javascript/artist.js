// Fetch random artists
async function fetchRandomArtists() {
    const randomLetter = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // Random letter a-z
    const response = await fetch(`https://itunes.apple.com/search?term=${randomLetter}&entity=musicArtist&limit=10`);
    const data = await response.json();
    return data.results;
}

// Fetch artist's top tracks
async function fetchTopTracks(artistId) {
    const response = await fetch(`https://itunes.apple.com/lookup?id=${artistId}&entity=song&limit=5`);
    const data = await response.json();
    return data.results.filter(result => result.wrapperType === 'track');
}

// Fetch artist's albums
async function fetchAlbums(artistId) {
    const response = await fetch(`https://itunes.apple.com/lookup?id=${artistId}&entity=album&limit=5`);
    const data = await response.json();
    return data.results.filter(result => result.wrapperType === 'collection');
}

// Display artists on the page
async function displayArtists() {
    const artists = await fetchRandomArtists();
    const artistsContainer = document.getElementById('artists');
    artistsContainer.innerHTML = '';

    for (const artist of artists) {
        const topTracks = await fetchTopTracks(artist.artistId);
        const albums = await fetchAlbums(artist.artistId);

        const artistElement = document.createElement('div');
        artistElement.classList.add('artist-card');

        artistElement.innerHTML = `
            <h2>${artist.artistName}</h2>
            <p><strong>Genre:</strong> ${artist.primaryGenreName || 'N/A'}</p>
            <p><strong>Artist Link:</strong> <a href="${artist.artistLinkUrl}" target="_blank">View on iTunes</a></p>
            
            <h3>Top Tracks:</h3>
            <ul>
                ${topTracks.map(track => `
                    <li>
                        <strong>${track.trackName}</strong><br>
                        <em>Album:</em> ${track.collectionName || 'N/A'}<br>
                        <em>Release Date:</em> ${new Date(track.releaseDate).toLocaleDateString() || 'N/A'}<br>
                        <em>Duration:</em> ${Math.floor(track.trackTimeMillis / 60000)}:${((track.trackTimeMillis % 60000) / 1000).toFixed(0).padStart(2, '0')}<br>
                        <a href="${track.trackViewUrl}" target="_blank">Listen on iTunes</a>
                    </li>
                `).join('')}
            </ul>

            <h3>Albums:</h3>
            <ul>
                ${albums.map(album => `
                    <li>
                        <strong>${album.collectionName}</strong><br>
                        <em>Release Date:</em> ${new Date(album.releaseDate).toLocaleDateString() || 'N/A'}<br>
                        <em>Track Count:</em> ${album.trackCount || 'N/A'}<br>
                        <a href="${album.collectionViewUrl}" target="_blank">View on iTunes</a>
                    </li>
                `).join('')}
            </ul>

            <h3>Artist Statistics:</h3>
            <p><strong>Total Albums:</strong> ${albums.length}</p>
            <p><strong>Total Tracks:</strong> ${topTracks.length}</p>
        `;
        artistsContainer.appendChild(artistElement);
    }
}

displayArtists();