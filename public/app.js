async function updatePortfolio(userId) {
    try {
      const response = await fetch(`/api/portfolio/${userId}`);
      const data = await response.json();
  
      const formattedValue = `$${data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      document.getElementById("stockValue").textContent = formattedValue;
      const formattedGain = `$${data.gain.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      document.getElementById("profit-loss").textContent = formattedGain;
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
  
    // … aquí inicializas tus charts y resto del dashboard …
  });
