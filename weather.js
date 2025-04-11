const WEATHER_API_KEY = 'fdeafcc5a8c0ea20c5b28b7782a8793b'; // Get from OpenWeatherMap

async function getWeather() {
    try {
        // Get user's location
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`
        );
        
        const data = await response.json();
        
        const weatherWidget = document.getElementById('weather-widget');
        weatherWidget.innerHTML = `
            <div class="weather-content">
                <div class="weather-main">
                    <img src="http://openweathermap.org/img/w/${data.weather[0].icon}.png" alt="Weather icon">
                    <span class="temperature">${Math.round(data.main.temp)}°C</span>
                </div>
                <div class="weather-info">
                    <span class="location">${data.name}</span>
                    <span class="description">${data.weather[0].description}</span>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error fetching weather:', error);
        const weatherWidget = document.getElementById('weather-widget');
        weatherWidget.innerHTML = '<div class="weather-error">Unable to fetch weather</div>';
    }
}

document.addEventListener('DOMContentLoaded', getWeather);
