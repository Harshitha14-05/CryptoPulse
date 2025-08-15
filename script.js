const cryptoContainer = document.getElementById("crypto-container");
const lastUpdated = document.getElementById("last-updated");
const loading = document.getElementById("loading");
const searchInput = document.getElementById("search");

let allData = [];
let modalChart;

const cryptos = [
  { id: "bitcoin", symbol: "BTC" },
  { id: "ethereum", symbol: "ETH" },
  { id: "dogecoin", symbol: "DOGE" },
  { id: "solana", symbol: "SOL" },
  { id: "cardano", symbol: "ADA" }
];

async function fetchPrices() {
  const ids = cryptos.map(c => c.id).join(",");
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&sparkline=true&price_change_percentage=24h`;

  try {
    loading.style.display = "block";
    const res = await fetch(url);
    const data = await res.json();
    allData = data;

    displayCards(allData);

    lastUpdated.textContent = `Last Updated: ${new Date().toLocaleTimeString()}`;
    loading.style.display = "none";
  } catch (error) {
    console.error("Failed to fetch crypto data:", error);
    cryptoContainer.innerHTML = "<p style='color:red;'>⚠ Error fetching data. Please try again later.</p>";
    loading.style.display = "none";
  }
}

function displayCards(data) {
  cryptoContainer.innerHTML = "";

  data.forEach((crypto, index) => {
    const change = crypto.price_change_percentage_24h;
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          <img src="${crypto.image}" alt="${crypto.name}" class="crypto-logo" />
          <div>${crypto.symbol}</div>
          <div>$${crypto.current_price.toFixed(2)}</div>
          <div class="${change >= 0 ? 'price-up' : 'price-down'}">${change.toFixed(2)}%</div>
        </div>
        <div class="card-back" onclick="openModal('${crypto.id}')">
          <span>View Details</span>
        </div>
      </div>
    `;
    cryptoContainer.appendChild(card);
  });
}

async function openModal(cryptoId) {
  const modal = document.getElementById("crypto-modal");
  modal.style.display = "block";

  const res = await fetch(`https://api.coingecko.com/api/v3/coins/${cryptoId}?localization=false&sparkline=true`);
  const coin = await res.json();

  document.getElementById("modal-logo").src = coin.image.large;
  document.getElementById("modal-name").textContent = coin.name;
  document.getElementById("modal-price").textContent = `Price: $${coin.market_data.current_price.usd}`;
  document.getElementById("modal-change").textContent = `24h Change: ${coin.market_data.price_change_percentage_24h.toFixed(2)}%`;
  document.getElementById("modal-marketcap").textContent = `Market Cap: $${coin.market_data.market_cap.usd.toLocaleString()}`;
  document.getElementById("modal-volume").textContent = `24h Volume: $${coin.market_data.total_volume.usd.toLocaleString()}`;

  if (modalChart) modalChart.destroy();
  const ctx = document.getElementById("modal-chart").getContext("2d");
  modalChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: coin.market_data.sparkline_7d.price.map((_, i) => i),
      datasets: [{
        data: coin.market_data.sparkline_7d.price,
        borderColor: coin.market_data.price_change_percentage_24h >= 0 ? "#2ecc71" : "#e74c3c",
        borderWidth: 1,
        pointRadius: 0,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      elements: { line: { tension: 0.3 } },
      plugins: { legend: { display: false } },
      scales: { x: { display: false }, y: { display: false } }
    }
  });
}

function closeModal() {
  document.getElementById("crypto-modal").style.display = "none";
}

function sortBy(type) {
  let sorted = [...allData];
  if (type === "gainers") sorted.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
  if (type === "losers") sorted.sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
  if (type === "priceHigh") sorted.sort((a, b) => b.current_price - a.current_price);
  if (type === "priceLow") sorted.sort((a, b) => a.current_price - b.current_price);
  displayCards(sorted);
}

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = allData.filter(c =>
    c.name.toLowerCase().includes(query) ||
    c.symbol.toLowerCase().includes(query)
  );
  displayCards(filtered);
});

fetchPrices();
setInterval(fetchPrices, 30000);
