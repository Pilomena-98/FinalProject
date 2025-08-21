(function(){
  function fmtToast(msg, ok=true) {
    alert(msg); // Simple: cambia por tu sistema de toasts si tienes
  }

  function getUserIdOrRedirect() {
    const userId = localStorage.getItem('userId');
    if (!userId) window.location.href = '/index.html';
    return userId;
  }

  async function prefillProfile() {
    const userId = getUserIdOrRedirect();
    try {
      const resp = await fetch(`/api/user/${userId}`);
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.error || 'Error');

      // Rellena inputs
      document.getElementById('username').value = `${data.user.name} ${data.user.last_Name}`.trim();
      document.getElementById('email').value = data.user.email || '';
      document.getElementById('phone').value = data.user.phone || '';
    } catch (e) {
      console.error(e);
      fmtToast('No se pudo cargar tu perfil', false);
    }
  }

  // Guardar perfil
  async function onSaveProfile() {
    const userId = getUserIdOrRedirect();
    const username = (document.getElementById('username').value || '').trim();
    const email = (document.getElementById('email').value || '').trim();
    const phone = (document.getElementById('phone').value || '').trim();
    const language = document.getElementById('language').value; // no está en DB; puedes guardarlo en localStorage

    // Split "Nombre Apellido" en name y last_Name
    let [name, ...rest] = username.split(' ').filter(Boolean);
    const last_Name = rest.join(' ') || '';

    if (!name || !last_Name || !email) {
      fmtToast('Nombre, Apellido y Email son obligatorios', false);
      return;
    }

    try {
      const resp = await fetch(`/api/user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, last_Name, email, phone })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.error || 'Error');

      // actualiza localStorage (opcional)
      localStorage.setItem('userName', name);
      localStorage.setItem('userLastName', last_Name);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userPhone', phone);
      localStorage.setItem('preferredLang', language);

      fmtToast('Perfil actualizado correctamente');
    } catch (e) {
      console.error(e);
      fmtToast(e.message || 'No se pudo actualizar el perfil', false);
    }
  }

  // Cambiar contraseña
  async function onSaveSecurity() {
    const userId = getUserIdOrRedirect();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword     = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
      fmtToast('Completa todos los campos de contraseña', false);
      return;
    }
    if (newPassword !== confirmPassword) {
      fmtToast('La nueva contraseña y su confirmación no coinciden', false);
      return;
    }
    if (newPassword.length < 8) {
      fmtToast('La nueva contraseña debe tener al menos 8 caracteres', false);
      return;
    }

    try {
      const resp = await fetch(`/api/user/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.error || 'Error');

      // Limpia inputs
      document.getElementById('current-password').value = '';
      document.getElementById('new-password').value = '';
      document.getElementById('confirm-password').value = '';

      fmtToast('Contraseña actualizada correctamente');
    } catch (e) {
      console.error(e);
      fmtToast(e.message || 'No se pudo actualizar la contraseña', false);
    }
  }

    // Eliminar cuenta
  async function deleteAccount() {
    const userId = localStorage.getItem('userId');
    if (!userId) return (window.location.href = '/index.html');

    // Confirmación
    const c1 = confirm('Esta acción es permanente. ¿Seguro que deseas eliminar tu cuenta?');
    if (!c1) return;
    const c2 = confirm('Confirma una vez más: se borrarán tus datos y transacciones. ¿Continuar?');
    if (!c2) return;

    try {
      const resp = await fetch(`/api/user/${userId}`, { method: 'DELETE' });
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || !data.success) {
        alert(data.error || 'No se pudo eliminar la cuenta');
        return;
      }

      // Limpia sesión del navegador
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userLastName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userPhone');
      localStorage.removeItem('preferredLang');
      localStorage.removeItem('user');

      alert('Tu cuenta ha sido eliminada. Gracias por usar COCO.');
      window.location.href = '/index.html';
    } catch (e) {
      console.error(e);
      alert('Error de red al eliminar la cuenta');
    }
  }


  // Navegación de secciones (ya la tienes)
  function setupSettingsNavigation() {
    const categoryItems = document.querySelectorAll('.category-item');
    const settingsSections = document.querySelectorAll('.settings-section');
    categoryItems.forEach(item => {
      item.addEventListener('click', function() {
        const target = this.getAttribute('data-target');
        categoryItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        settingsSections.forEach(section => section.classList.remove('active'));
        document.getElementById(`${target}-section`).classList.add('active');
      });
    });
  }

  // Fecha
  function setCurrentDate() {
    const now = new Date();
    document.getElementById('current-date').textContent =
      now.toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  }

  // INIT
  window.addEventListener('DOMContentLoaded', () => {
    setCurrentDate();
    setupSettingsNavigation();
    prefillProfile();

    document.getElementById('save-profile-btn')?.addEventListener('click', onSaveProfile);
    document.getElementById('save-security-btn')?.addEventListener('click', onSaveSecurity);
    document.getElementById('delete-account-btn')?.addEventListener('click', deleteAccount);
  });
})();
