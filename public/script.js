/**************************************************
 * CONFIG
 **************************************************/
const API_KEY = 'f5b55c70e58214ca052308349faccf96';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const IMG_SMALL = 'https://image.tmdb.org/t/p/w92';
const TOTAL_PAGES = 15;

/**************************************************
 * MODE
 **************************************************/
const params = new URLSearchParams(window.location.search);
const MODE = params.get('mode') || 'display'; // display | controller
const ROOM = params.get('room') || null;

const socket = io();

/**************************************************
 * ELEMENTS
 **************************************************/
const moviesContainer = document.getElementById('moviesContainer');
const searchInput = document.getElementById('movieSearch');
const suggestions = document.getElementById('suggestions');
const sliderContainer = document.getElementById('sliderContainer');

const genreInput = document.getElementById('genre');
const yearInput = document.getElementById('year');
const actorInput = document.getElementById('actor');
const advancedSearchBtn = document.getElementById('advancedSearchBtn');

/**************************************************
 * SOCKET SETUP
 **************************************************/

if (MODE === 'controller' && ROOM) {
  socket.emit('join-controller', { room: ROOM });
}

/**************************************************
 * OPEN MOVIE (DISPLAY ONLY)
 **************************************************/
async function openMovie(movieId) {
  const res = await fetch(
    `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=videos,credits`
  );
  const data = await res.json();
  localStorage.setItem('selectedMovie', JSON.stringify(data));
  window.location.href = 'movie.html';
}

/**************************************************
 * RENDER MOVIES
 **************************************************/
function renderMovies(movies) {
  moviesContainer.innerHTML = '';
  sliderContainer.innerHTML = '';

  if (!movies || movies.length === 0) {
    moviesContainer.innerHTML =
      `<p style="text-align:center;margin-top:30px">No movies found</p>`;
    return;
  }

  movies.forEach((movie, index) => {
    const card = document.createElement('div');
    card.className = 'movie-card';

    card.innerHTML = `
      <img src="${movie.poster_path ? IMG_URL + movie.poster_path : ''}">
      <div class="movie-info">
        <div class="movie-title">${movie.title}</div>
      </div>
    `;

    card.addEventListener('click', () => {
      if (MODE === 'controller') {
        socket.emit('select-movie', {
          room: ROOM,
          movieId: movie.id
        });
      } else {
        openMovie(movie.id);
      }
    });

    moviesContainer.appendChild(card);

    if (index === 0 && MODE === 'display') {
      fetch(`${BASE_URL}/movie/${movie.id}/videos?api_key=${API_KEY}`)
        .then(r => r.json())
        .then(v => {
          const trailer = v.results.find(
            t => t.type === 'Trailer' && t.site === 'YouTube'
          );
          if (trailer) {
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1`;
            iframe.allow = 'autoplay; encrypted-media';
            sliderContainer.appendChild(iframe);
          }
        });
    }
  });
}

/**************************************************
 * FETCH HELPERS
 **************************************************/
async function fetchMultiplePages(buildUrl) {
  let allMovies = [];
  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const res = await fetch(buildUrl(page));
    const data = await res.json();
    if (!data.results?.length) break;
    allMovies = allMovies.concat(data.results);
  }
  return allMovies;
}

async function fetchNowPlaying() {
  const movies = await fetchMultiplePages(
    p => `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&page=${p}`
  );
  renderMovies(movies);
}

/**************************************************
 * SEARCH
 **************************************************/
searchInput?.addEventListener('input', async () => {
  const q = searchInput.value.trim();
  if (!q) {
    suggestions.style.display = 'none';
    fetchNowPlaying();
    return;
  }

  const res = await fetch(
    `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(q)}`
  );
  const data = await res.json();

  suggestions.innerHTML = '';
  data.results.slice(0, 5).forEach(movie => {
    const div = document.createElement('div');
    div.className = 'suggestion-item';
    div.innerHTML = `
      <img src="${movie.poster_path ? IMG_SMALL + movie.poster_path : ''}">
      <span>${movie.title}</span>
    `;
    div.onclick = () => {
      if (MODE === 'controller') {
        socket.emit('select-movie', { room: ROOM, movieId: movie.id });
      } else {
        openMovie(movie.id);
      }
    };
    suggestions.appendChild(div);
  });

  suggestions.style.display = 'block';
});

/**************************************************
 * ADVANCED FILTERS (FIXED)
 **************************************************/
advancedSearchBtn?.addEventListener('click', async () => {
  const genre = genreInput.value;
  const year = yearInput.value;
  const actor = actorInput.value;

  let actorId = null;

  // 🎭 Actor search
  if (actor) {
    const res = await fetch(
      `${BASE_URL}/search/person?api_key=${API_KEY}&query=${encodeURIComponent(actor)}`
    );
    const data = await res.json();
    if (data.results?.length) {
      actorId = data.results[0].id;
    }
  }

  const movies = await fetchMultiplePages(page => {
    let url =
      `${BASE_URL}/discover/movie?api_key=${API_KEY}` +
      `&sort_by=popularity.desc&page=${page}`;

    if (genre) url += `&with_genres=${genre}`;
    if (year) url += `&primary_release_year=${year}`;
    if (actorId) url += `&with_cast=${actorId}`;

    return url;
  });

  // 📱 لو من الموبايل → ابعث النتيجة
  if (MODE === 'controller') {
    socket.emit('filter-results', { room: ROOM, movies });
  } else {
    renderMovies(movies);
  }
});

/**************************************************
 * INIT
 **************************************************/
fetchNowPlaying();
