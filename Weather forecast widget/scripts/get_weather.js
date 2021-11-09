// Current weather data from https://www.weatherapi.com/docs/
// To use this widget you'll need a key, to get it use this link (free version is enough): https://www.weatherapi.com/pricing.aspx

const apiKey = ""; // your API key goes here

//Interaction with modal window
function getAutocompleteItems(value) {
  fetch(`http://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${value}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.length !== 0) {
        data.map((dataItem) => {
          let item = document.createElement("div");
          item.classList.add("autocompleteItem");
          item.innerHTML = dataItem.name;
          locationAutocomplete.append(item);
        });
      } else {
        locationAutocomplete.insertAdjacentHTML("afterbegin", "<div class='autocompleteItem'>No results</div>");
      }
    });
}

locationFormInput.oninput = (event) => {
  locationAutocomplete.style.display = "block";
  if (event.target.value) {
    getAutocompleteItems(event.target.value);
    locationAutocomplete.innerHTML = "";
  }
};

locationFormInput.onblur = () => {
  setTimeout(() => {
    locationAutocomplete.style.display = "none";
  }, 500);
};

locationAutocomplete.onclick = (event) => {
  locationFormInput.value = event.target.innerHTML;
  locationAutocomplete.style.display = "none";
};

function setUserCity(event) {
  event.preventDefault();
  const value = locationFormInput.value;
  if (value) {
    const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${value}&days=2&lang=en`;
    showLoader();
    getWeather(apiUrl);
  } else {
    locationFormInput.classList.add("shake");
    setTimeout(() => {
      locationFormInput.classList.remove("shake");
    }, 800);
    locationFormInput.focus();
  }
}

submitLocationBtn.onclick = setUserCity;

// Functions to change windows
function showLoader() {
  locationForm.style.display = "none";
  loader.style.display = "flex";
}

function hideModal() {
  loader.style.display = "none";
  modal.style.display = "none";
  weatherInfo.style.display = "block";
  locationFormPhrase.innerHTML = "Please enter your city name";
}

function showModal() {
  loader.style.display = "none";
  weatherInfo.style.display = "none";
  modal.style.display = "block";
  locationFormInput.value = "";
  locationForm.style.display = "block";
  locationAutocomplete.innerHTML = "";
  locationFormInput.focus();
}

// Getting the data from API
function checkErrorStatus(res) {
  function showErrorType(phrase) {
    locationFormPhrase.innerHTML = phrase;
    showModal();
  }

  if (res.status === 200) {
    return res.json();
  } else if (res.status === 400) {
    showErrorType("Invalid city name. Try again.");
  } else if (res.status === 401 || res.status === 403) {
    showErrorType("Data loading error");
  } else if (res.status >= 500) {
    showErrorType("Server error. Please try again later.");
  } else {
    showErrorType("Unknown error");
  }
}

function getWeather(url) {
  fetch(url)
    .then((response) => {
      return checkErrorStatus(response);
    })
    .then((data) => {
      // Creating an object with necessary information from response
      const weatherData = {
        currentTime: data.location.localtime,
        locationCity: data.location.name,
        locationCountry: data.location.country,
        //
        temperatureReal: data.current.temp_c,
        temperatureFeel: data.current.feelslike_c,
        //
        wind: data.current.wind_kph,
        windDirection: data.current.wind_degree,
        humidity: data.current.humidity,
        pressure: data.current.pressure_mb,
        //
        weatherCode: data.current.condition.code,
        weatherDescription: data.current.condition.text,
        //
        startOfCurrentDay: data.forecast.forecastday[0].date_epoch,
        sunriseTime: data.forecast.forecastday[0].astro.sunrise,
        sunsetTime: data.forecast.forecastday[0].astro.sunset,
        startOfNextDay: data.forecast.forecastday[1].date_epoch,
        nextSunriseTime: data.forecast.forecastday[1].astro.sunrise,
      };

      const location = weatherData.locationCity;
      city.innerHTML = `${location}, ${weatherData.locationCountry}`;

      // Getting time parameters
      const currentTimeArray = weatherData.currentTime.split(/[-\s:]/);
      const currentTimeStamp =
        Date.UTC(
          currentTimeArray[0],
          currentTimeArray[1] - 1,
          currentTimeArray[2],
          currentTimeArray[3],
          currentTimeArray[4]
        ) / 1000;

      time.innerHTML = `
          ${currentTimeArray[2]}.${currentTimeArray[1]}.${currentTimeArray[0]},
          ${currentTimeArray[3]}:${currentTimeArray[4]}
        `;

      function sunriseAndSunsetTimeArray(time) {
        const timeArray = [];
        if (/PM$/.test(time)) {
          timeArray.push((+time.slice(0, 2) + 12).toString());
        } else {
          timeArray.push(time.slice(0, 2));
        }
        timeArray.push(time.slice(3, 5));
        return timeArray;
      }

      function sunriseAndSunsetStamp(startOfDay, timeArray) {
        return startOfDay + timeArray[0] * 3600 + timeArray[1] * 60;
      }

      const sunriseArray = sunriseAndSunsetTimeArray(weatherData.sunriseTime);
      const sunsetArray = sunriseAndSunsetTimeArray(weatherData.sunsetTime);
      const nextSunriseArray = sunriseAndSunsetTimeArray(weatherData.nextSunriseTime);

      const sunriseStamp = sunriseAndSunsetStamp(weatherData.startOfCurrentDay, sunriseArray);
      const sunsetStamp = sunriseAndSunsetStamp(weatherData.startOfCurrentDay, sunsetArray);
      const nextSunriseStamp = sunriseAndSunsetStamp(weatherData.startOfNextDay, nextSunriseArray);

      function getPrevDate(currentDate) {
        const date = new Date(currentDate[0], currentDate[1] - 1, currentDate[2] - 1);
        return date;
      }
      const prevDate = getPrevDate(currentTimeArray);
      const prevDateString = `${prevDate.getFullYear()}-${prevDate.getMonth() + 1}-${prevDate.getDate()}`;

      const isDay = currentTimeStamp > sunriseStamp && currentTimeStamp < sunsetStamp;
      const beforeSunrise = currentTimeStamp <= sunriseStamp;
      const afterSunset = currentTimeStamp >= sunsetStamp;

      // Inserting weather information
      temperature.innerHTML = ` ${Math.round(weatherData.temperatureReal)}&#176;`;
      feelsLike.innerHTML = ` ${Math.round(weatherData.temperatureFeel)}&#176;`;
      weather.innerHTML = weatherData.weatherDescription;

      function getWindDirection(degree) {
        if ((degree > 330 && degree <= 360) || (degree <= 30 && degree >= 0)) {
          return "N";
        } else if (degree > 30 && degree <= 60) {
          return "NE";
        } else if (degree > 60 && degree <= 120) {
          return "E";
        } else if (degree > 120 && degree <= 150) {
          return "SE";
        } else if (degree > 150 && degree <= 210) {
          return "S";
        } else if (degree > 210 && degree <= 240) {
          return "SW";
        } else if (degree > 240 && degree <= 300) {
          return "W";
        } else if (degree > 300 && degree <= 330) {
          return "NW";
        } else {
          throw new Error("Wrong wind direction value");
        }
      }

      wind.innerHTML = Math.round(weatherData.wind / 3.6);
      windDirection.innerHTML = getWindDirection(weatherData.windDirection);
      humidity.innerHTML = weatherData.humidity;
      pressure.innerHTML = Math.round(weatherData.pressure / 1.333);

      //Changing theme
      // You can find weather codes and icons here: https://www.weatherapi.com/docs/#weather-icons
      const weatherGoups = {
        thunder: [1087],
        rain: [1186, 1189, 1192, 1195, 1240, 1243, 1246],
        rain_thunder: [1273, 1276],
        snow_rain: [1069, 1072, 1198, 1201, 1204, 1207, 1237, 1249, 1252, 1261, 1264],
        mist: [1030, 1135, 1147],
        drizzle: [1063, 1150, 1153, 1180, 1183],
        snow_drizzle: [1168, 1171],
        cloudy: [1006, 1009],
        partly_cloudy: [1003],
        snow: [1117, 1216, 1219, 1222, 1225, 1258, 1066, 1114, 1210, 1213, 1255],
        snow_thunder: [1279, 1282],
        clear: [1000],
      };

      function getWeatherGroup(value) {
        return Object.keys(weatherGoups).find((key) => weatherGoups[key].includes(value));
      }

      const darkBlueColor = "#0d145e";
      const whiteColor = "white";

      function changeTheme(theme, color, weather) {
        weatherIcon.src = `images/${theme}_${weather}.png`;
        weatherInfo.style.backgroundImage = `url(images/bckgr_${theme}_${weather}.jpg)`;
        wind.style.backgroundImage = `url(images/${theme}_wind.png)`;
        humidity.style.backgroundImage = `url(images/${theme}_humidity.png)`;
        pressure.style.backgroundImage = `url(images/${theme}_pressure.png)`;
        durationIcon.style.backgroundImage = `url(images/${theme}_duration.png)`;
        weatherInfo.style.setProperty("--color-theme", color);
        metricsInfo.style.borderColor = color;
        durationScaleBefore.style.borderColor = color;
        durationScaleAfter.style.borderColor = color;
      }

      if (isDay) {
        changeTheme("day", darkBlueColor, getWeatherGroup(weatherData.weatherCode));
      } else {
        changeTheme("night", whiteColor, getWeatherGroup(weatherData.weatherCode));
      }

      // Inserting information about sunrise, sunset and duration
      // Second fetch is necessary to get information about the previous day
      const innerUrl = `https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${location}&dt=${prevDateString}&lang=en`;

      fetch(innerUrl)
        .then((InnerResponse) => {
          return checkErrorStatus(InnerResponse);
        })
        .then((innerData) => {
          // Actions after full loading
          hideModal();
          closeModalBtn.style.display = "block";
          closeModalBtn.onclick = hideModal;
          changeCityBtn.onclick = showModal;

          const startOfPrevDay = innerData.forecast.forecastday[0].date_epoch;

          const prevSunsetTime = innerData.forecast.forecastday[0].astro.sunset;
          const prevSunsetArray = sunriseAndSunsetTimeArray(prevSunsetTime);
          const prevSunsetStamp = sunriseAndSunsetStamp(startOfPrevDay, prevSunsetArray);

          const dayDuration = sunsetStamp - sunriseStamp;
          const currentNightDuration = nextSunriseStamp - sunsetStamp;
          const prevNightDuration = sunriseStamp - prevSunsetStamp;

          function setDurationData(
            currentStamp,
            startName,
            startArray,
            startStamp,
            endName,
            endArray,
            endStamp,
            periodName,
            periodDuration
          ) {
            durationStart.innerHTML = `${startName} <br>${startArray.join(":")}`;
            durationEnd.innerHTML = `${endName} <br>${endArray.join(":")}`;
            duration.innerHTML = `${periodName} duration : ${Math.floor(periodDuration / 3600)} h ${
              Math.floor(periodDuration / 60) - Math.floor(periodDuration / 3600) * 60
            } m`;

            const durationPast = ((currentStamp - startStamp) / periodDuration) * 100;
            const durationLeft = ((endStamp - currentStamp) / periodDuration) * 100;

            durationIcon.style.backgroundPosition = `${durationPast}%`;
            durationScaleBefore.style.width = `${durationPast}%`;
            durationScaleAfter.style.width = `${durationLeft}%`;
          }

          if (isDay) {
            setDurationData(
              currentTimeStamp,
              "Sunrise",
              sunriseArray,
              sunriseStamp,
              "Sunset",
              sunsetArray,
              sunsetStamp,
              "Day",
              dayDuration
            );
          } else {
            if (beforeSunrise) {
              setDurationData(
                currentTimeStamp,
                "Sunset",
                prevSunsetArray,
                prevSunsetStamp,
                "Sunrise",
                sunriseArray,
                sunriseStamp,
                "Night",
                prevNightDuration
              );
            } else if (afterSunset) {
              setDurationData(
                currentTimeStamp,
                "Sunset",
                sunsetArray,
                sunsetStamp,
                "Sunrise",
                nextSunriseArray,
                nextSunriseStamp,
                "Night",
                currentNightDuration
              );
            } else {
              console.error("Time periods setting error");
            }
          }
        });
    });
}
