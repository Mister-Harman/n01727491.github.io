// JavaScript for the page
document.addEventListener('DOMContentLoaded', function() {
    const MAX_FAVORITES = 20;
    const MAX_WORDS = 100;
    const storageKey = 'favoriteSongs';
    
    // Load favorites from localStorage
    let favorites = JSON.parse(localStorage.getItem(storageKey)) || [];
    
    // DOM elements
    const favoritesList = document.getElementById('favorites-list');
    const addButton = document.getElementById('add-favorite');
    const clearButton = document.getElementById('clear-all');
    const titleInput = document.getElementById('song-title');
    const artistInput = document.getElementById('song-artist');
    const messageInput = document.getElementById('song-message');
    const wordCounter = document.getElementById('word-counter');
    
    // Count words in a string
    function countWords(text) {
        if (!text.trim()) return 0;
        return text.trim().split(/\s+/).length;
    }
    
    // Update word counter
    function updateWordCounter() {
        const wordCount = countWords(messageInput.value);
        wordCounter.textContent = `${wordCount}/${MAX_WORDS} words`;
        wordCounter.classList.toggle('warning', wordCount > MAX_WORDS);
    }
    
    // Render favorites list
    function renderFavorites() {
        favoritesList.innerHTML = '';
        
        if (favorites.length === 0) {
            favoritesList.innerHTML = `
                <div class="empty-state">
                    <h3>No favorites yet</h3>
                    <p>Your favorite songs will appear here. Add some songs you love!</p>
                </div>
            `;
            return;
        }
        
        favorites.forEach((song, index) => {
            const songCard = document.createElement('div');
            songCard.className = 'song-card';
            songCard.innerHTML = `
                <div class="song-details">
                    <div class="song-title">${song.title}</div>
                    <div class="song-artist">${song.artist}</div>
                    ${song.message ? `<div class="song-message" title="${song.message}">${song.message}</div>` : ''}
                    <button class="btn btn-remove" data-index="${index}">
                        Remove
                    </button>
                </div>
            `;
            
            favoritesList.appendChild(songCard);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.btn-remove').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                removeFavorite(index);
            });
        }); 
    }
    
    // Add a new favorite
    function addFavorite(title, artist, message) {
        // Validate word count
        const wordCount = countWords(message);
        if (wordCount > MAX_WORDS) {
            alert(`Message cannot exceed ${MAX_WORDS} words. Current: ${wordCount}`);
            return;
        }
        
        // Create new song object
        const newSong = {
            id: Date.now().toString(),
            title: title.trim(),
            artist: artist.trim(),
            message: message.trim(),
            dateAdded: new Date().toISOString()
        };
        
        // Check if song already exists
        const existingIndex = favorites.findIndex(
            song => song.title.toLowerCase() === newSong.title.toLowerCase() && 
                   song.artist.toLowerCase() === newSong.artist.toLowerCase()
        );
        
        if (existingIndex !== -1) {
            // Remove existing version to update position
            favorites.splice(existingIndex, 1);
        }
        
        // Add to beginning of arra
        favorites.unshift(newSong);
        
        // remove if exceeds max size
        if (favorites.length > MAX_FAVORITES) {
            favorites = favorites.slice(0, MAX_FAVORITES);
        }
        
        // Save and render
        saveFavorites();
        renderFavorites();
        
        // Clear form
        titleInput.value = '';
        artistInput.value = '';
        messageInput.value = '';
        updateWordCounter();
    }
    
    // Remove a favorite
    function removeFavorite(index) {
        favorites.splice(index, 1);
        saveFavorites();
        renderFavorites();
    }
    
    // Clear all favorites
    function clearFavorites() {
        favorites = [];
        saveFavorites();
        renderFavorites();
       
    }
    
    // Save favorites to localStorage
    function saveFavorites() {
        localStorage.setItem(storageKey, JSON.stringify(favorites));
    }
    
    // Event listeners
    addButton.addEventListener('click', function() {
        const title = titleInput.value;
        const artist = artistInput.value;
        const message = messageInput.value;
        
        if (title && artist) {
            addFavorite(title, artist, message);
        } else {
            alert('Please enter at least a song title and artist');
        }
    });
    
    clearButton.addEventListener('click', clearFavorites);
    
    // Word count tracking
    messageInput.addEventListener('input', updateWordCounter);
    
    // Allow adding by pressing Enter in title/artist fields
    [titleInput, artistInput].forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addButton.click();
            }
        });
    });
    
    // Initial render and word count setup
    renderFavorites();
    updateWordCounter();
});