// ================= MAP =================
const map = L.map("map").setView([20.5937, 78.9629], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap",
}).addTo(map);

const markersLayer = L.layerGroup().addTo(map);

// ================= ELEMENTS =================
const searchBtn = document.getElementById("searchBtn");
const myLocationBtn = document.getElementById("myLocationBtn");
const locationInput = document.getElementById("locationInput");
const statusText = document.getElementById("status");

// ================= API KEY =================
const API_KEY = "7e42ed2b-7b09-481e-b783-010d33ea6349";

// ================= FETCH NEAREST STATIONS =================
async function fetchNearestStations(lat, lon) {
  statusText.innerText = "🔄 Finding nearest charging stations...";
  markersLayer.clearLayers();

  const url =
    `https://api.openchargemap.io/v3/poi/?` +
    `output=json` +
    `&latitude=${lat}` +
    `&longitude=${lon}` +
    `&distance=25` +
    `&distanceunit=KM` +
    `&maxresults=15` +
    `&key=${API_KEY}`;

  try {
    const res = await fetch(url);
    const stations = await res.json();

    if (!stations.length) {
      statusText.innerText = " No charging stations found nearby";
      return;
    }

    // SORT BY DISTANCE (NEAREST FIRST)
    stations.sort((a, b) => a.AddressInfo.Distance - b.AddressInfo.Distance);

    stations.forEach((station, index) => {
      const info = station.AddressInfo;
      if (!info) return;

      const marker = L.marker([info.Latitude, info.Longitude]).bindPopup(`
          <b>${index + 1}. ${info.Title}</b><br/>
          ${info.AddressLine1 || ""}<br/>
          📍 <b>${info.Distance.toFixed(2)} km away</b><br/>
          🔌 Connectors: ${station.Connections?.length || 0}
        `);

      markersLayer.addLayer(marker);
    });

    map.setView([lat, lon], 13);
    statusText.innerText = `✅ Showing ${stations.length} nearest charging stations`;
  } catch (err) {
    console.error(err);
    statusText.innerText = "⚠️ Error loading charging stations";
  }
}

// ================= SEARCH BY CITY =================
searchBtn.addEventListener("click", async () => {
  const location = locationInput.value.trim();
  if (!location) {
    alert("Please enter a city or place");
    return;
  }

  statusText.innerText = "🔍 Searching location...";

  const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${location}`;

  try {
    const res = await fetch(geoUrl, {
      headers: {
        "User-Agent": "EV-Charging-Station-Finder",
      },
    });

    const data = await res.json();

    if (!data.length) {
      statusText.innerText = "❌ Location not found";
      return;
    }

    fetchNearestStations(parseFloat(data[0].lat), parseFloat(data[0].lon));
  } catch (error) {
    statusText.innerText = "⚠️ Location search failed";
  }
});

// ================= USE MY LOCATION =================
myLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  statusText.innerText = "📍 Getting your location...";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      fetchNearestStations(pos.coords.latitude, pos.coords.longitude);
    },
    () => {
      statusText.innerText = "❌ Location permission denied";
    }
  );
});
