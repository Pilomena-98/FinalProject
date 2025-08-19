async function updatePortfolio(userId) {
    try {
      const response = await fetch(`/api/portfolio/${userId}`);
      const data = await response.json();
  
      const formattedValue = `$${data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      document.getElementById("stockValue").textContent = formattedValue;
    } catch (err) {
      console.error("❌ Error al obtener portafolio:", err);
    }
  }
  
  // Ejecutar cuando la página cargue
  document.addEventListener("DOMContentLoaded", () => updatePortfolio(1402944639)); // <-- userId = 5
  
