/* =====================================================
   SKYFEEL — WEATHER APP SCRIPT.JS
   Tugas Dasar Pemrograman Web
   Menggunakan: Vanilla JavaScript, Fetch API, async/await
   ===================================================== */

// =====================================================
// 0. KONFIGURASI API
// =====================================================
// >>> GANTI BAGIAN INI DENGAN API KEY OPENWEATHERMAP MILIK ANDA <<<
// Cara mendapatkan API Key gratis dijelaskan lengkap di README.md
const API_KEY = "d80e031985ef8034aa64de2060d7f027";

// Endpoint dasar OpenWeatherMap (paket gratis / free tier)
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// =====================================================
// 1. SELEKSI ELEMEN DOM
// =====================================================
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locateBtn = document.getElementById("locateBtn");

const loadingBox = document.getElementById("loadingBox");
const errorBox = document.getElementById("errorBox");
const errorText = document.getElementById("errorText");
const weatherCard = document.getElementById("weatherCard");
const emptyState = document.getElementById("emptyState");

const cityName = document.getElementById("cityName");
const countryName = document.getElementById("countryName");
const updateTime = document.getElementById("updateTime");
const weatherIcon = document.getElementById("weatherIcon");
const temperature = document.getElementById("temperature");
const condition = document.getElementById("condition");
const feelsLike = document.getElementById("feelsLike");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const pressure = document.getElementById("pressure");
const visibility = document.getElementById("visibility");
const sunrise = document.getElementById("sunrise");
const sunset = document.getElementById("sunset");

const forecastRow = document.getElementById("forecastRow");
const historyRow = document.getElementById("historyRow");

const weatherBg = document.getElementById("weatherBg");
const bgParticles = document.getElementById("bgParticles");

const themeToggle = document.getElementById("themeToggle");
const unitToggle = document.getElementById("unitToggle");
const liveClock = document.getElementById("liveClock");
const favBtn = document.getElementById("favBtn");

// =====================================================
// 2. STATE / DATA APLIKASI
// =====================================================
let lastWeatherData = null;
let lastForecastData = null;
let currentUnit = "metric"; // "metric" = Celsius, "imperial" = Fahrenheit

let searchHistory = JSON.parse(localStorage.getItem("skyfeel-history")) || [];
let favoriteCities =
  JSON.parse(localStorage.getItem("skyfeel-favorites")) || [];

// =====================================================
// 3. FUNGSI BANTUAN (HELPER FUNCTIONS)
// =====================================================

function showLoading() {
  loadingBox.classList.remove("hidden");
  errorBox.classList.add("hidden");
  weatherCard.classList.add("hidden");
  emptyState.classList.add("hidden");
}

function hideLoading() {
  loadingBox.classList.add("hidden");
}

function showError(message) {
  hideLoading();
  weatherCard.classList.add("hidden");
  emptyState.classList.add("hidden");
  errorText.textContent = message;
  errorBox.classList.remove("hidden");
}

function hideError() {
  errorBox.classList.add("hidden");
}

function formatLocalTime(unixSeconds, timezoneOffset) {
  const localMs = (unixSeconds + timezoneOffset) * 1000;
  const date = new Date(localMs);
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatUpdateTime() {
  const now = new Date();
  const options = { day: "numeric", month: "long", year: "numeric" };
  const tanggal = now.toLocaleDateString("id-ID", options);
  const jam = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Update: ${jam}, ${tanggal}`;
}

function getIconUrl(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

function getBackgroundClass(main, iconCode) {
  const isNight = iconCode.includes("n");

  switch (main) {
    case "Clear":
      return isNight ? "bg-clear-night" : "bg-clear-day";
    case "Clouds":
      return "bg-clouds";
    case "Rain":
    case "Drizzle":
      return "bg-rain";
    case "Thunderstorm":
      return "bg-thunder";
    case "Snow":
      return "bg-snow";
    case "Mist":
    case "Fog":
    case "Haze":
    case "Smoke":
    case "Dust":
      return "bg-mist";
    default:
      return isNight ? "bg-clear-night" : "bg-clear-day";
  }
}

function updateBackground(main, iconCode) {
  weatherBg.className = "weather-bg";
  const bgClass = getBackgroundClass(main, iconCode);
  weatherBg.classList.add(bgClass);

  bgParticles.innerHTML = "";

  if (main === "Rain" || main === "Drizzle" || main === "Thunderstorm") {
    createParticles("drop", 40);
  } else if (main === "Snow") {
    createParticles("flake", 35);
  }
}

function createParticles(type, count) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = type;
    el.style.left = Math.random() * 100 + "%";
    el.style.animationDuration =
      (type === "drop" ? 0.6 + Math.random() * 0.6 : 4 + Math.random() * 4) +
      "s";
    el.style.animationDelay = Math.random() * 5 + "s";

    if (type === "flake") {
      const size = 3 + Math.random() * 4;
      el.style.width = size + "px";
      el.style.height = size + "px";
    }

    bgParticles.appendChild(el);
  }
}

// =====================================================
// 4. FUNGSI UTAMA: MENGAMBIL DATA CUACA DARI API
// =====================================================

async function fetchWeatherByCity(city) {
  const url = `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${currentUnit}&lang=id`;
  return fetchJson(url);
}

async function fetchWeatherByCoords(lat, lon) {
  const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${currentUnit}&lang=id`;
  return fetchJson(url);
}

async function fetchForecast(city) {
  const url = `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${currentUnit}&lang=id`;
  return fetchJson(url);
}

async function fetchJson(url) {
  // Peringatan dini jika API key belum diganti, supaya errornya jelas
  if (!API_KEY || API_KEY === "MASUKKAN_API_KEY_DISINI") {
    throw new Error(
      "API Key belum diisi. Buka index.js lalu ganti nilai API_KEY dengan API Key OpenWeatherMap Anda.",
    );
  }

  let response;

  try {
    response = await fetch(url);
  } catch (networkError) {
    throw new Error(
      "Tidak ada koneksi internet. Periksa jaringan Anda dan coba lagi.",
    );
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Kota tidak ditemukan. Periksa kembali ejaan nama kota.");
    }
    if (response.status === 401) {
      throw new Error(
        "API Key tidak valid. Pastikan Anda sudah memasukkan API Key yang benar di index.js.",
      );
    }
    throw new Error(
      "Gagal mengambil data cuaca dari server. Silakan coba lagi.",
    );
  }

  return response.json();
}

// =====================================================
// 5. FUNGSI UTAMA: MENAMPILKAN DATA KE HALAMAN
// =====================================================

function renderWeather(data) {
  lastWeatherData = data;

  const tempUnit = currentUnit === "metric" ? "°C" : "°F";
  const windUnit = currentUnit === "metric" ? "m/s" : "mph";

  cityName.textContent = data.name;
  countryName.textContent = data.sys.country;
  updateTime.textContent = formatUpdateTime();

  weatherIcon.src = getIconUrl(data.weather[0].icon);
  weatherIcon.alt = data.weather[0].description;

  temperature.textContent = `${Math.round(data.main.temp)}${tempUnit}`;
  condition.textContent = data.weather[0].description;
  feelsLike.textContent = `Terasa seperti: ${Math.round(data.main.feels_like)}${tempUnit}`;

  humidity.textContent = `${data.main.humidity}%`;
  windSpeed.textContent = `${data.wind.speed} ${windUnit}`;
  pressure.textContent = `${data.main.pressure} hPa`;
  visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;

  sunrise.textContent = formatLocalTime(data.sys.sunrise, data.timezone);
  sunset.textContent = formatLocalTime(data.sys.sunset, data.timezone);

  updateBackground(data.weather[0].main, data.weather[0].icon);
  updateFavButton(data.name);

  weatherCard.classList.remove("hidden");
  emptyState.classList.add("hidden");
  errorBox.classList.add("hidden");
}

function renderForecast(data) {
  lastForecastData = data;
  forecastRow.innerHTML = "";

  const tempUnit = currentUnit === "metric" ? "°" : "°";

  const dailyMap = {};
  data.list.forEach((item) => {
    const dateKey = item.dt_txt.split(" ")[0];
    const hour = item.dt_txt.split(" ")[1];

    if (!dailyMap[dateKey] || hour === "12:00:00") {
      dailyMap[dateKey] = item;
    }
  });

  const dailyEntries = Object.values(dailyMap).slice(0, 5);

  dailyEntries.forEach((item) => {
    const dateObj = new Date(item.dt_txt.replace(" ", "T"));
    const dayName = dateObj.toLocaleDateString("id-ID", { weekday: "short" });

    const card = document.createElement("div");
    card.className = "forecast-item";
    card.innerHTML = `
      <span class="forecast-day">${dayName}</span>
      <img class="forecast-icon" src="${getIconUrl(item.weather[0].icon)}" alt="${item.weather[0].description}" />
      <span class="forecast-temp">${Math.round(item.main.temp)}${tempUnit}</span>
    `;
    forecastRow.appendChild(card);
  });
}

// =====================================================
// 6. FUNGSI PENCARIAN UTAMA (DIPANGGIL SAAT TOMBOL/ENTER DIKLIK)
// =====================================================

async function searchWeather(cityFromHistory) {
  const city = (cityFromHistory || cityInput.value).trim();

  if (city === "") {
    showError(
      "Nama kota tidak boleh kosong. Silakan ketik nama kota terlebih dahulu.",
    );
    return;
  }

  showLoading();

  try {
    const [weatherData, forecastData] = await Promise.all([
      fetchWeatherByCity(city),
      fetchForecast(city),
    ]);

    renderWeather(weatherData);
    renderForecast(forecastData);
    saveToHistory(weatherData.name);
    cityInput.value = "";
  } catch (error) {
    showError(error.message);
  } finally {
    hideLoading();
  }
}

async function searchWeatherByLocation() {
  if (!navigator.geolocation) {
    showError("Perangkat/browser Anda tidak mendukung fitur deteksi lokasi.");
    return;
  }

  showLoading();

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const weatherData = await fetchWeatherByCoords(latitude, longitude);
        const forecastData = await fetchForecast(weatherData.name);

        renderWeather(weatherData);
        renderForecast(forecastData);
        saveToHistory(weatherData.name);
      } catch (error) {
        showError(error.message);
      } finally {
        hideLoading();
      }
    },
    () => {
      hideLoading();
      showError(
        "Tidak dapat mengakses lokasi Anda. Pastikan izin lokasi sudah diaktifkan.",
      );
    },
  );
}

// =====================================================
// 7. RIWAYAT PENCARIAN (HISTORY) & FAVORIT
// =====================================================

function saveToHistory(city) {
  searchHistory = searchHistory.filter(
    (item) => item.toLowerCase() !== city.toLowerCase(),
  );
  searchHistory.unshift(city);
  searchHistory = searchHistory.slice(0, 5);

  localStorage.setItem("skyfeel-history", JSON.stringify(searchHistory));
  renderHistory();
}

function renderHistory() {
  historyRow.innerHTML = "";

  searchHistory.forEach((city) => {
    const isFav = favoriteCities.some(
      (fav) => fav.toLowerCase() === city.toLowerCase(),
    );

    const chip = document.createElement("button");
    chip.className = "history-chip";
    chip.innerHTML = `${isFav ? '<span class="star">★</span>' : "📍"} ${city}`;
    chip.addEventListener("click", () => searchWeather(city));

    historyRow.appendChild(chip);
  });
}

function toggleFavorite() {
  if (!lastWeatherData) return;

  const city = lastWeatherData.name;
  const index = favoriteCities.findIndex(
    (fav) => fav.toLowerCase() === city.toLowerCase(),
  );

  if (index === -1) {
    favoriteCities.push(city);
  } else {
    favoriteCities.splice(index, 1);
  }

  localStorage.setItem("skyfeel-favorites", JSON.stringify(favoriteCities));
  updateFavButton(city);
  renderHistory();
}

function updateFavButton(city) {
  const isFav = favoriteCities.some(
    (fav) => fav.toLowerCase() === city.toLowerCase(),
  );
  favBtn.textContent = isFav ? "★" : "☆";
  favBtn.classList.toggle("active", isFav);
}

// =====================================================
// 8. TOGGLE SATUAN SUHU (CELSIUS <-> FAHRENHEIT)
// =====================================================

async function toggleUnit() {
  currentUnit = currentUnit === "metric" ? "imperial" : "metric";
  unitToggle.textContent = currentUnit === "metric" ? "°C" : "°F";

  if (lastWeatherData) {
    showLoading();
    try {
      const city = lastWeatherData.name;
      const [weatherData, forecastData] = await Promise.all([
        fetchWeatherByCity(city),
        fetchForecast(city),
      ]);
      renderWeather(weatherData);
      renderForecast(forecastData);
    } catch (error) {
      showError(error.message);
    } finally {
      hideLoading();
    }
  }
}

// =====================================================
// 9. DARK MODE / LIGHT MODE
// =====================================================

function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("skyfeel-theme", isDark ? "dark" : "light");
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem("skyfeel-theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀️";
  }
}

// =====================================================
// 10. JAM & TANGGAL REAL-TIME
// =====================================================

function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  liveClock.textContent = time;
}

// =====================================================
// 11. EVENT LISTENERS
// =====================================================

searchBtn.addEventListener("click", () => searchWeather());

cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchWeather();
  }
});

cityInput.addEventListener("input", hideError);

locateBtn.addEventListener("click", searchWeatherByLocation);

themeToggle.addEventListener("click", toggleTheme);

unitToggle.addEventListener("click", toggleUnit);

favBtn.addEventListener("click", toggleFavorite);

// =====================================================
// 12. INISIALISASI SAAT HALAMAN DIMUAT
// =====================================================
window.addEventListener("DOMContentLoaded", () => {
  console.log("index.js berhasil dimuat.");

  applySavedTheme();
  renderHistory();

  updateClock();
  setInterval(updateClock, 1000);

  weatherBg.classList.add("bg-clear-day");
});
