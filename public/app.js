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
  
    // … aquí inicializas tus charts y resto del dashboard …
  });
