const IMG_URL = 'https://image.tmdb.org/t/p/w500';

// عناصر الصفحة
const movieTitleEl = document.getElementById('movieTitle');
const movieSummary = document.getElementById('movieSummary');
const movieCast = document.getElementById('movieCast');
const movieTrailer = document.getElementById('movieTrailer');
const trailerWrap = document.getElementById('trailerWrap');
const moviePoster = document.getElementById('moviePoster');
const movieDetails = document.getElementById('movieDetails');
const backBtn = document.getElementById('backBtn');
const watchBtn = document.getElementById('watchNowBtn');

// جلب الفيلم من localStorage
const movie = JSON.parse(localStorage.getItem('selectedMovie'));

if (!movie) {
  alert('No movie selected! Please go back to the home page and select a movie.');
} else {
  // ===== تعبئة البيانات =====
  movieTitleEl.textContent = movie.title || 'No Title';
  movieSummary.textContent = movie.overview || 'No summary available';
  moviePoster.src = movie.poster_path ? IMG_URL + movie.poster_path : 'placeholder.jpg';

  // Badges
  document.getElementById('badgeYear').textContent =
    movie.release_date ? movie.release_date.split('-')[0] : '—';

  document.getElementById('badgeRating').textContent =
    `★ ${movie.vote_average ?? '—'}`;

  document.getElementById('badgeRuntime').textContent =
    movie.runtime ? `${movie.runtime} min` : '—';

  // ===== Trailer (YouTube) =====
  const mainTrailer = movie.videos?.results?.find(
    v => v.type === 'Trailer' && v.site === 'YouTube'
  );

  if (mainTrailer) {
    movieTrailer.src = `https://www.youtube.com/embed/${mainTrailer.key}?autoplay=1&mute=1`;
  }

  // ===== Cast =====
  movieCast.innerHTML = '';
  (movie.credits?.cast || []).slice(0, 20).forEach(c => {
    const li = document.createElement('li');
    li.className = 'cast-card';
    li.innerHTML = `
      <a href="https://www.google.com/search?q=${encodeURIComponent(c.name)}" target="_blank">
        <img src="${c.profile_path ? IMG_URL + c.profile_path : 'placeholder.jpg'}" alt="${c.name}">
        <p class="cast-name">${c.name}</p>
        <p class="cast-character">${c.character || ''}</p>
      </a>
    `;
    movieCast.appendChild(li);
  });

  // ===== Details =====
  if (movieDetails) {
    const spoken = movie.spoken_languages?.map(l => l.english_name).join(', ') || 'N/A';
    const genres = movie.genres?.map(g => g.name).join(', ') || 'N/A';

    movieDetails.innerHTML = `
      <p><strong>Original Language:</strong> ${movie.original_language?.toUpperCase() || 'N/A'}</p>
      <p><strong>Spoken Languages:</strong> ${spoken}</p>
      <p><strong>Vote Average:</strong> ${movie.vote_average || 'N/A'} / 10</p>
      <p><strong>Release Date:</strong> ${movie.release_date || 'N/A'}</p>
      <p><strong>Runtime:</strong> ${movie.runtime || 'N/A'} min</p>
      <p><strong>Genres:</strong> ${genres}</p>
      <p><strong>Status:</strong> ${movie.status || 'N/A'}</p>
      <p><strong>IMDb ID:</strong> ${movie.imdb_id || 'N/A'}</p>
    `;
  }
}

// ===== زر الرجوع =====
backBtn?.addEventListener('click', () => {
  window.location.href = 'index.html';
});

// ===== Watch Now (تشغيل مباشر داخل نفس مكان التريلر) =====
watchBtn?.addEventListener('click', () => {
  if (!movie?.id || !movie?.title) {
    alert('Movie data is missing');
    return;
  }

  // إنشاء slug من العنوان
  const slug = movie.title
    .trim()
    .replace(/[^a-zA-Z0-9 ]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  const watchUrl = `https://flixmomo.org/movie/${movie.id}/${slug}/watch`;

  // استبدال التريلر بالفيديو
  movieTrailer.src = '';
  movieTrailer.src = watchUrl;
  movieTrailer.setAttribute('allow', 'autoplay; fullscreen');
  movieTrailer.setAttribute('allowfullscreen', 'true');

  // إخفاء زر المشاهدة
  watchBtn.style.display = 'none';
});
