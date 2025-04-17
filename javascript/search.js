const CLIENT_ID = '1e0d0b4825894ff0ba560c6354afad43';
const CLIENT_SECRET = '0b0f234d23fa4ce0bf2527ed02d3cac4';

let accessToken = '';

// Function to authenticate with Spotify API
async function authenticate() {         
  const authUrl = 'https://accounts.spotify.com/api/token';
  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();
  accessToken = data.access_token;
}

// Function to search Spotify
async function search() {
  const query = document.getElementById('searchInput').value;
  const filter = document.getElementById('filter').value;

  if (!query) {
    alert('Please enter a search query.');
    return;
  }

  // Authenticate if access token is not available
  if (!accessToken) {
    await authenticate();
  }

  const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${filter}&limit=10`;
  const response = await fetch(searchUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  const data = await response.json();

  displayResults(data);
}

// Function to fetch artist's top tracks
async function fetchTopTracks(artistId) {
  const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  const data = await response.json();
  return data.tracks;
}

// Function to fetch artist's albums
async function fetchAlbums(artistId) {
  const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?limit=5`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  const data = await response.json();
  return data.items;
}

// Function to display results with artist details
async function displayResults(data) {
  const resultsContainer = document.getElementById('results');
  resultsContainer.innerHTML = '';

  if (data.artists && data.artists.items.length > 0) {
    for (const artist of data.artists.items) {
      const topTracks = await fetchTopTracks(artist.id);
      const albums = await fetchAlbums(artist.id);

      const artistElement = document.createElement('div');
      artistElement.className = 'result-item';
      artistElement.innerHTML = `
        <div class="image-container">
          <img src="${artist.images[0]?.url || 'https://via.placeholder.com/150'}" alt="${artist.name}" width="150">
        </div>
        <h2>${artist.name}</h2>
        <p><strong>Genres:</strong> ${artist.genres.join(', ') || 'N/A'}</p>
        <p><strong>Popularity:</strong> ${artist.popularity}</p>
        <p><strong>Followers:</strong> ${artist.followers.total.toLocaleString()}</p>
        <p><a href="${artist.external_urls.spotify}" target="_blank">View on Spotify</a></p>
        <h3>Top Tracks:</h3>
        <ul>
          ${topTracks.map(track => `<li>${track.name}</li>`).join('')}
        </ul>
        <h3>Albums:</h3>
        <ul>
          ${albums.map(album => `<li>${album.name}</li>`).join('')}
        </ul>
      `;
      resultsContainer.appendChild(artistElement);
    }
  }

  if (data.tracks && data.tracks.items.length > 0) {
    for (const track of data.tracks.items) {
      const trackItem = document.createElement('div');
      trackItem.className = 'result-item';
      trackItem.innerHTML = `
        <div class="image-container">
        ${track.album.images.length ? `<img src="${track.album.images[0].url}" width="100">` : 'N/A'}<br>
        </div>
        <h2> ${track.name} </h2>
        <strong>Artist:</strong> ${track.artists.map(artist => artist.name).join(', ')}<br>
        <strong>Album:</strong> ${track.album.name}<br>
        <strong>Release Date:</strong> ${track.album.release_date}<br>
        <strong>Duration:</strong> ${Math.floor(track.duration_ms / 60000)}:${((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}<br>
        <strong>Popularity:</strong> ${track.popularity}<br>
        <strong>Track Number:</strong> ${track.track_number}<br>  
        <a href="${track.external_urls.spotify}" target="_blank">Open in Spotify</a>
        <hr>
        <div>
        <strong>Lyrics:</strong> <span class="lyrics">Loading...</span>
        </div>
      `;
      resultsContainer.appendChild(trackItem);

      // Fetch and display lyrics
      const lyricsElement = trackItem.querySelector('.lyrics');
      const lyrics = await fetchLyrics(track.artists[0].name, track.name);
      lyricsElement.innerHTML = lyrics;
    }
  }

  if (resultsContainer.innerHTML === '') {
    resultsContainer.innerHTML = '<p>No results found.</p>';
  }
}

// Function to fetch lyrics
async function fetchLyrics(artist, track) {
  const lyricsUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(track)}`;
  try {
    const response = await fetch(lyricsUrl);
    if (!response.ok) throw new Error('Lyrics not found');
    const data = await response.json();
    return data.lyrics ? data.lyrics.replace(/\n/g, '<br>') : 'Lyrics not available.';
  } catch (error) {
    return 'Lyrics not available.';
  }
}
