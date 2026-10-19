
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const message = document.getElementById("message");
const currentWeather = document.getElementById("currentWeather");
const forecastSection = document.getElementById("forecastSection");
const forecastContainer = document.getElementById("forecast");

function getWeatherInfo(code) {
    const weatherTypes = {
        0: ["Clear sky", "☀️"],
        1: ["Mainly clear", "🌤️"],
        2: ["Partly cloudy", "⛅"],
        3: ["Overcast", "☁️"],
        45: ["Foggy", "🌫️"],
        48: ["Rime fog", "🌫️"],
        51: ["Light drizzle", "🌦️"],
        53: ["Drizzle", "🌦️"],
        55: ["Heavy drizzle", "🌧️"],
        61: ["Light rain", "🌦️"],
        63: ["Moderate rain", "🌧️"],
        65: ["Heavy rain", "🌧️"],
        71: ["Light snow", "🌨️"],
        73: ["Moderate snow", "🌨️"],
        75: ["Heavy snow", "❄️"],
        80: ["Rain showers", "🌦️"],
        81: ["Moderate showers", "🌧️"],
        82: ["Heavy showers", "⛈️"],
        95: ["Thunderstorm", "⛈️"],
        96: ["Thunderstorm with hail", "⛈️"],
        99: ["Heavy thunderstorm with hail", "⛈️"]
    };

    return weatherTypes[code] || ["Weather unavailable", "🌡️"];
}

function formatDate(dateString) {
    return new Date(dateString + "T00:00:00").toLocaleDateString(
        "en-IN",
        { weekday: "short", day: "numeric", month: "short" }
    );
}

async function getWeather(city) {
    message.textContent = "Loading weather...";
    currentWeather.hidden = true;
    forecastSection.hidden = true;

    const searchButton = searchForm.querySelector("button");
    searchButton.disabled = true;
    searchButton.textContent = "Loading...";

    try {
        // Find the city's latitude and longitude.
        const geoUrl =
            "https://geocoding-api.open-meteo.com/v1/search?name=" +
            encodeURIComponent(city) +
            "&count=1&language=en&format=json";

        const geoResponse = await fetch(geoUrl);

        if (!geoResponse.ok) {
            throw new Error("Unable to search for the city.");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found. Please check the name.");
        }

        const place = geoData.results[0];

        // Fetch current weather and five-day forecast.
        const weatherUrl =
            "https://api.open-meteo.com/v1/forecast?" +
            `latitude=${place.latitude}` +
            `&longitude=${place.longitude}` +
            "&current=temperature_2m,relative_humidity_2m," +
            "apparent_temperature,weather_code,wind_speed_10m" +
            "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
            "&timezone=auto&forecast_days=5";

        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            throw new Error("Unable to load weather data. Try again.");
        }

        const data = await weatherResponse.json();

        displayCurrentWeather(place, data);
        displayForecast(data.daily);

        message.textContent = "";
        currentWeather.hidden = false;
        forecastSection.hidden = false;

    } catch (error) {
        message.textContent =
            error.message === "Failed to fetch"
                ? "Network error. Check your internet and try again."
                : error.message;
    } finally {
        searchButton.disabled = false;
        searchButton.textContent = "Search";
    }
}

function displayCurrentWeather(place, data) {
    const current = data.current;
    const [description, icon] = getWeatherInfo(current.weather_code);

    document.getElementById("cityName").textContent =
        `${place.name}, ${place.country}`;

    document.getElementById("weatherIcon").textContent = icon;

    document.getElementById("temperature").textContent =
        `${Math.round(current.temperature_2m)}°C`;

    document.getElementById("description").textContent = description;

    document.getElementById("feelsLike").textContent =
        `${Math.round(current.apparent_temperature)}°C`;

    document.getElementById("humidity").textContent =
        `${current.relative_humidity_2m}%`;

    document.getElementById("wind").textContent =
        `${current.wind_speed_10m} km/h`;
}

function displayForecast(daily) {
    forecastContainer.replaceChildren();

    daily.time.forEach((date, index) => {
        const [description, icon] =
            getWeatherInfo(daily.weather_code[index]);

        const card = document.createElement("article");
        card.className = "forecast-card";

        const dateElement = document.createElement("p");
        dateElement.textContent = formatDate(date);

        const iconElement = document.createElement("div");
        iconElement.className = "icon";
        iconElement.textContent = icon;

        const descriptionElement = document.createElement("p");
        descriptionElement.textContent = description;

        const highElement = document.createElement("p");
        highElement.className = "high";
        highElement.textContent =
            `${Math.round(daily.temperature_2m_max[index])}°C`;

        const lowElement = document.createElement("p");
        lowElement.className = "low";
        lowElement.textContent =
            `${Math.round(daily.temperature_2m_min[index])}°C`;

        card.append(
            dateElement,
            iconElement,
            descriptionElement,
            highElement,
            lowElement
        );

        forecastContainer.appendChild(card);
    });
}

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        message.textContent = "Please enter a city name.";
        return;
    }

    getWeather(city);
});

// Load a sample default city on opening.
getWeather("Coimbatore");
