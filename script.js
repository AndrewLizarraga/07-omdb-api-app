const searchForm = document.getElementById('search-form');
const movieResults = document.getElementById('movie-results');
const watchlist = document.getElementById('watchlist');

// Store watchlist movies in memory while the page is open
const watchlistMovies = [];
const watchlistStorageKey = `movieWatchlist`;

const saveWatchlist = () => {
  localStorage.setItem(watchlistStorageKey, JSON.stringify(watchlistMovies));
};

const loadWatchlist = () => {
  const savedWatchlist = localStorage.getItem(watchlistStorageKey);

  if (savedWatchlist) {
    const parsedWatchlist = JSON.parse(savedWatchlist);

    parsedWatchlist.forEach((movie) => {
      watchlistMovies.push(movie);
    });
  }
};

const showSearchError = (message) => {
  movieResults.innerHTML = `<p class="no-results">${message}</p>`;
};

const fetchMovies = async (query) => {
  const apiKey = `2bd7252b`;
  const url = `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${apiKey}`;

  // Fetch data from API and catch network-level failures
  const response = await fetch(url).catch((error) => {
    console.error(`Network error while fetching movies:`, {
      query,
      url,
      message: error.message,
    });
    return null;
  });

  if (!response) {
    showSearchError(`Something went wrong. Please check your internet and try again.`);
    return;
  }

  // Check HTTP status before reading response body
  if (!response.ok) {
    console.error(`OMDb request failed with non-OK status:`, {
      query,
      url,
      status: response.status,
      statusText: response.statusText,
    });
    showSearchError(`We could not load movies right now. Please try again in a moment.`);
    return;
  }

  const data = await response.json().catch((error) => {
    console.error(`Failed to parse OMDb response JSON:`, {
      query,
      url,
      message: error.message,
    });
    return null;
  });

  if (!data) {
    showSearchError(`We received an invalid response. Please try again.`);
    return;
  }

  // OMDb returns Response as a string: "True" or "False"
  if (data.Response === `True` && Array.isArray(data.Search)) {
    displayMovies(data.Search);
  } else {
    console.warn(`OMDb returned no results or an API-level error:`, {
      query,
      apiError: data.Error,
      responseFlag: data.Response,
    });
    showSearchError(`No results found. Please try a different search.`);
  }
};

const displayMovies = (movies) => {
  movieResults.innerHTML = ``; //Clear Prev search

  movies.forEach((movie) => {
    const movieCard = document.createElement(`div`);
    movieCard.className = `movie-card`;

    movieCard.innerHTML = `
    <img src="${movie.Poster}" alt="${movie.Title}" class="movie-poster">
    <div class="movie-info">
      <h3 class="movie-title">${movie.Title} </h3>
      <p class="movie-year">${movie.Year}</p>
      <button class="btn" data-id="${movie.imdbID}">Add to Watchlist</button>
    </div> 
    `;

    const addButton = movieCard.querySelector(`.btn`);
    addButton.addEventListener(`click`, () => {
      addToWatchlist(movie);
    });

    movieResults.appendChild(movieCard);
  });
};

const addToWatchlist = (movie) => {
  // Prevent duplicate entries by checking imdbID
  const alreadyInWatchlist = watchlistMovies.some((savedMovie) => {
    return savedMovie.imdbID === movie.imdbID;
  });

  if (alreadyInWatchlist) {
    return;
  }

  watchlistMovies.push(movie);
  saveWatchlist();
  renderWatchlist();
};

const removeFromWatchlist = (imdbID) => {
  const movieIndex = watchlistMovies.findIndex((movie) => {
    return movie.imdbID === imdbID;
  });

  if (movieIndex === -1) {
    return;
  }

  watchlistMovies.splice(movieIndex, 1);
  saveWatchlist();
  renderWatchlist();
};

const renderWatchlist = () => {
  if (watchlistMovies.length === 0) {
    watchlist.innerHTML = `Your watchlist is empty. Search for movies to add!`;
    return;
  }

  watchlist.innerHTML = ``;

  watchlistMovies.forEach((movie) => {
    const movieCard = document.createElement(`div`);
    movieCard.className = `movie-card`;

    movieCard.innerHTML = `
    <img src="${movie.Poster}" alt="${movie.Title}" class="movie-poster">
    <div class="movie-info">
      <h3 class="movie-title">${movie.Title}</h3>
      <p class="movie-year">${movie.Year}</p>
      <button class="btn btn-remove" data-id="${movie.imdbID}">Remove</button>
    </div>
    `;

    const removeButton = movieCard.querySelector(`.btn-remove`);
    removeButton.addEventListener(`click`, () => {
      removeFromWatchlist(movie.imdbID);
    });

    watchlist.appendChild(movieCard);
  });
};

searchForm.addEventListener(`submit`, (event) => {
  event.preventDefault();

  // Read what the user typed in the search box
  const query = document.getElementById(`movie-search`).value.trim();

  if (query) {
    fetchMovies(query);
  }
});

// Show default empty watchlist message on first page load
loadWatchlist();
renderWatchlist();