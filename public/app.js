async function updatePortfolio(userId) {
    try {
      const response = await fetch(`/api/portfolio/${userId}`);
      const data = await response.json();
  
      const formattedValue = `$${data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      document.getElementById("stockValue").textContent = formattedValue;
      const formattedGain = `$${data.gain.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      document.getElementById("profit-loss").textContent = formattedGain;
      const formattedPastGain = `$${data.gainPast.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      document.getElementById("profit-p-loss").textContent = formattedPastGain;
    } catch (err) {
      console.error("❌ Error al obtener portafolio:", err);
    }
  }

  async function loadPortfolioHistoryChart() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = '/index.html';
    return;
  }

  try {
    const resp = await fetch(`/api/portfolio-history/${userId}`);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const series = await resp.json(); // [{date:'2025-07-01', value:12345.67}, ...]

    // Ordenar por fecha por si llega desordenado
    series.sort((a, b) => a.date.localeCompare(b.date));

    const labels = series.map(d => d.date);
    const values = series.map(d => d.value);

    const ctx = document.getElementById('portfolioHistoryChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Portfolio Value',
          data: values,
          borderColor: '#3182CE',
          backgroundColor: 'rgba(49,130,206,0.15)',
          fill: true,
          tension: 0.3,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.parsed.y ?? 0;
                return ` $${v.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
              }
            }
          }
        },
        scales: {
          y: {
            ticks: {
              callback: (v) => '$' + Number(v).toLocaleString('es-MX')
            },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  } catch (err) {
    console.error('Error cargando historial:', err);
  }
}
  
async function loadSharesPieChart() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = '/index.html';
    return;
  }

  try {
    const resp = await fetch(`/api/current-shares/${userId}`);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json(); // [{ticker:'AAPL', quantity:10}, {ticker:'MSFT', quantity:5}]

    const labels = data.map(d => d.ticker);
    const values = data.map(d => d.current_shares);

    const ctx = document.getElementById('sharesPieChart').getContext('2d');
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: [
            '#3182CE', '#E53E3E', '#38A169', '#D69E2E', '#805AD5', '#DD6B20', '#319795'
          ],
          borderColor: '#fff',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right' },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed || 0;
                return `${ctx.label}: ${val.toLocaleString('es-MX')}`;
              }
            }
          }
        }
      }
    });
  } catch (err) {
    console.error('Error cargando acciones:', err);
  }
}

function fmtCurrency(n) {
  return '$' + (Number(n) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}
function fmtNumber(n) {
  return (Number(n) || 0).toLocaleString('es-MX');
}
function fmtPct(n) {
  const v = Number(n) || 0;
  return (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
}

async function loadPortfolioSummary() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.location.href = '/index.html';
    return;
  }

  try {
    const resp = await fetch(`/api/portfolio-summary/${userId}`);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const { rows } = await resp.json();

    const tbody = document.querySelector('#portfolioSummaryTable tbody');
    tbody.innerHTML = '';

    rows.forEach(r => {
      const tr = document.createElement('tr');
      const posClass = r.profitLoss >= 0 ? 'up' : 'down'; // usa tus clases .trend.up/.trend.down si quieres

      tr.innerHTML = `
        <td>${r.enterprise ?? ''}</td>
        <td>${r.profitLoss}</td>
        <td>${fmtNumber(r.currentShares)}</td>
        <td>${fmtCurrency(r.meanCost)}</td>
        <td>${fmtCurrency(r.currentPrice)}</td>
        <td>${fmtCurrency(r.marketValue)}</td>
        <td class="${posClass}">${fmtCurrency(r.uprofitLoss)}</td>
        <td class="${posClass}">${fmtPct(r.profitLossPct)}</td>
      `;
      tbody.appendChild(tr);
    });

    // botón de descarga CSV (opcional)
    const btn = document.getElementById('downloadSummaryBtn');
    btn?.addEventListener('click', () => downloadSummaryCSV(rows));
  } catch (err) {
    console.error('Error cargando resumen:', err);
  }
}

function downloadSummaryCSV(rows) {
  const headers = [
    'Ticker','Enterprise','Current Shares','Mean Cost','Current Price','Market Value','Profit Loss','Profit Loss %'
  ];
  const csv = [
    headers.join(','),
    ...rows.map(r => [
      r.ticker,
      (r.enterprise ?? '').replace(/,/g, ' '),
      r.currentShares,
      r.meanCost,
      r.currentPrice,
      r.marketValue,
      r.profitLoss,
      r.profitLossPct
    ].join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'portfolio_summary.csv';
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('calc-asset-btn').addEventListener('click', async () => {
  const stockValue = document.getElementById('asset-name').value;
  const type = document.getElementById('asset-type').value;
  const qty = parseInt(document.getElementById('asset-quantity').value, 10);

  if (!stockValue || !qty || qty <= 0) {
    alert("Selecciona una acción y cantidad válida");
    return;
  }

  // Extraer ticker de "Apple Inc. (AAPL)" => "AAPL"
  //const tickerMatch = stockValue.match(/\(([^)]+)\)/);
  const ticker = stockValue; // tickerMatch ? tickerMatch[1] : null;

  /*if (!ticker) {
    alert(stockValue + " no es un ticker válido");
    return;
  }*/

  try {
    const resp = await fetch(`/api/stock-price/${ticker}`);
    if (!resp.ok) throw new Error("No se pudo obtener el precio del mercado");

    const { open } = await resp.json(  );

    let total = open * qty;
    if (type === "sell") {
      total = total; // en venta simplemente mostramos el valor de venta
    }
    
    document.getElementById('asset-total').value =
      `$${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  } catch (err) {
    console.error(err);
    alert("Error consultando precio");
  }
});

document.getElementById('save-asset-btn').addEventListener('click', async () => {
  const userId = localStorage.getItem('userId');
  if (!userId) return (window.location.href = '/index.html');

  const select = document.getElementById('asset-name');
  const ticker = select.value; // si option.value = 'AAPL' (recomendado)
  const type = document.getElementById('asset-type').value; // 'buy' | 'sell'
  const qty = parseInt(document.getElementById('asset-quantity').value, 10);

  if (!ticker || !qty || qty <= 0) {
    alert('Selecciona un stock y una cantidad válida');
    return;
  }

  try {
    const resp = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        ticker,
        type: type.toUpperCase(),
        quantity: qty
      })
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      alert(data.error || 'No se pudo guardar el trade');
      return;
    }

    // Opcional: mostrar confirmación con precio y amount calculados en servidor
    alert(`Trade guardado. Precio: $${data.price.toFixed(2)} | Monto: $${data.amount.toFixed(2)}`);

    // Refresca tus tarjetas / tablas / gráficas
    // carga el total del portafolio con ese userId
    updatePortfolio(userId);
    // carga el historial del portafolio
    loadPortfolioHistoryChart();
    // carga las acciones actuales
    loadSharesPieChart()
    // carga el resumen del portafolio
    loadPortfolioSummary();
  
  } catch (err) {
    console.error(err);
    alert('Error de red al guardar el trade');
  }
});

  // Ejecutar cuando la página cargue
  //document.addEventListener("DOMContentLoaded", () => updatePortfolio(1402944639)); // <-- userId = 5
  document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
  
    if (!userId) {
      // si no hay sesión, regresa al login
      window.location.href = '/index.html';
      return;
    }
  
    // pinta el nombre si quieres
    const name = localStorage.getItem('userName') || '';
    document.getElementById("name").textContent = name;
    //const nameEl = document.querySelector('.user-name');
    //if (nameEl && name) nameEl.textContent = name;
  
    // carga el total del portafolio con ese userId
    updatePortfolio(userId);
    // carga el historial del portafolio
    loadPortfolioHistoryChart();
    // carga las acciones actuales
    loadSharesPieChart()
    // carga el resumen del portafolio
    loadPortfolioSummary();
  
    // … aquí inicializas tus charts y resto del dashboard …
  });
