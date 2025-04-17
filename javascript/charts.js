async function fetchTopSongs() {
    try {
        const region = document.getElementById('filter').value;
        const response = await fetch(`https://itunes.apple.com/${region}/rss/topsongs/limit=10/json`);
        const data = await response.json();
        const songs = data.feed.entry;
        
        const chart = document.getElementById('chart');
        chart.innerHTML = '';
        
        songs.forEach((song, index) => {
            const songElement = document.createElement('div');
            songElement.classList.add('song');
            
            const coverImg = `<img class="cover" src="${song['im:image'][2].label}" alt="Album Cover">`;
            const title = `<div class="details">
                <strong>Rank:</strong> ${index + 1}<br>
                <strong>Song:</strong> ${song.title.label}<br>
                <strong>Artist:</strong> ${song['im:artist'].label}<br>
                <strong>Album:</strong> ${song['im:collection'] ? song['im:collection'].label : 'N/A'}<br>
                <strong>Release Date:</strong> ${song['im:releaseDate'] ? song['im:releaseDate'].label.split('T')[0] : 'N/A'}<br>
                <strong>Preview Link: </strong><a class="preview" href="${song.link[0].attributes.href}" target="_blank">Listen</a>
                
            </div>`;
            
            songElement.innerHTML = `${coverImg} ${title}`;
            chart.appendChild(songElement);
        });
    } catch (error) {
        console.error('Error fetching top songs:', error);
    }
}

fetchTopSongs();
