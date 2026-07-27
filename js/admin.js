(function () {
  'use strict';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const money = (n) => '$' + Number(n || 0).toLocaleString('es-CL');
  const pad2 = (n) => String(n).padStart(2, '0');
  const toISODate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  function toast(msg, ms) {
    const container = $('#toast-container');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), ms || 3500);
  }

  function isSupabaseConfigured() {
    return typeof SUPABASE_URL === 'string' && !SUPABASE_URL.includes('TU-PROYECTO') && !SUPABASE_ANON_KEY.includes('TU-ANON-KEY');
  }

  /* ------------------------------- WhatsApp helpers ------------------------------- */

  function waPhone(phone) {
    let digits = (phone || '').replace(/\D/g, '');
    digits = digits.replace(/^0+/, '');
    if (digits.length === 9 && digits.startsWith('9')) digits = '56' + digits; // celular chileno sin código de país
    return digits;
  }

  function waLink(phone, message) {
    return `https://wa.me/${waPhone(phone)}?text=${encodeURIComponent(message)}`;
  }

  function msgConfirmacion(b) {
    return `Hola ${b.customer_name}! 💈 Confirmamos tu hora en Mashita Barber:\n📅 ${b.date} a las ${b.time}\n✂️ ${b.service_name}\n\n¡Te esperamos!`;
  }
  function msgRecordatorio(b) {
    return `Hola ${b.customer_name}! 💈 Te recordamos tu hora en Mashita Barber:\n📅 ${b.date} a las ${b.time}\n✂️ ${b.service_name}\n\n¡Nos vemos pronto!`;
  }

  /* ------------------------------- Auth / pantallas ------------------------------- */

  function showScreen(id) {
    ['notConfiguredScreen', 'loginScreen', 'dashboard'].forEach(s => {
      $('#' + s).style.display = s === id ? (s === 'dashboard' ? 'block' : 'flex') : 'none';
    });
  }

  async function initAuth() {
    if (!isSupabaseConfigured()) { showScreen('notConfiguredScreen'); return; }

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      showScreen('dashboard');
      initDashboard();
    } else {
      showScreen('loginScreen');
    }

    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        showScreen('dashboard');
        initDashboard();
      } else if (event === 'SIGNED_OUT') {
        showScreen('loginScreen');
      }
    });

    $('#loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const errEl = $('#loginError');
      errEl.style.display = 'none';
      const { error } = await supabaseClient.auth.signInWithPassword({ email: fd.get('email'), password: fd.get('password') });
      if (error) {
        errEl.textContent = error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos.' : error.message;
        errEl.style.display = 'block';
      }
    });

    $('#logoutBtn').addEventListener('click', async () => {
      await supabaseClient.auth.signOut();
    });
  }

  let dashboardInitialized = false;
  function initDashboard() {
    if (dashboardInitialized) { loadSchedule(); loadBlockedDates(); loadBookings(); loadPhotosTab(); return; }
    dashboardInitialized = true;
    initTabs();
    initScheduleTab();
    initBookingsTab();
    initPhotosTab();
  }

  /* ------------------------------- Tabs ------------------------------- */

  function initTabs() {
    $$('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.admin-tab').forEach(t => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        $$('.admin-panel').forEach(p => p.classList.toggle('is-active', p.dataset.panel === tab.dataset.tab));
      });
    });
  }

  /* ------------------------------- HORARIOS ------------------------------- */

  function initScheduleTab() {
    renderClosedDaysGrid([0, 1]);
    loadSchedule();
    loadBlockedDates();

    $('#scheduleForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const closedDays = $$('.admin-day-toggle input:checked').map(c => Number(c.value));
      const { error } = await supabaseClient.from('settings').update({
        start_hour: Number(fd.get('startHour')),
        end_hour: Number(fd.get('endHour')),
        closed_days: closedDays,
      }).eq('id', 1);
      if (error) { toast('Error al guardar horario: ' + error.message); return; }
      toast('✅ Horario actualizado');
    });

    $('#blockedDateForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const { error } = await supabaseClient.from('blocked_dates').insert({ date: fd.get('date'), reason: fd.get('reason') || null });
      if (error) { toast('Error al agregar fecha: ' + error.message); return; }
      e.target.reset();
      loadBlockedDates();
      toast('✅ Día bloqueado agregado');
    });
  }

  function renderClosedDaysGrid(checkedDays) {
    const grid = $('#closedDaysGrid');
    grid.innerHTML = DAY_NAMES.map((name, i) => `
      <label class="admin-day-toggle">
        <input type="checkbox" value="${i}" ${checkedDays.includes(i) ? 'checked' : ''}>
        ${name}
      </label>
    `).join('');
  }

  async function loadSchedule() {
    const { data, error } = await supabaseClient.from('settings').select('*').eq('id', 1).single();
    if (error) { toast('Error cargando horario: ' + error.message); return; }
    $('#scheduleForm').startHour.value = data.start_hour;
    $('#scheduleForm').endHour.value = data.end_hour;
    renderClosedDaysGrid(data.closed_days || []);
  }

  async function loadBlockedDates() {
    const list = $('#blockedDatesList');
    const { data, error } = await supabaseClient.from('blocked_dates').select('*').order('date', { ascending: true });
    if (error) { list.innerHTML = `<p class="admin-list-empty">Error: ${error.message}</p>`; return; }
    if (!data.length) { list.innerHTML = `<p class="admin-list-empty">No hay días bloqueados.</p>`; return; }
    list.innerHTML = data.map(d => `
      <div class="admin-list-item blocked-date-item">
        <span><strong>${d.date}</strong>${d.reason ? ' — ' + d.reason : ''}</span>
        <button class="btn btn--outline btn--sm" data-delete-blocked="${d.id}">Eliminar</button>
      </div>
    `).join('');
    $$('[data-delete-blocked]', list).forEach(btn => {
      btn.addEventListener('click', async () => {
        const { error } = await supabaseClient.from('blocked_dates').delete().eq('id', btn.dataset.deleteBlocked);
        if (error) { toast('Error al eliminar: ' + error.message); return; }
        loadBlockedDates();
      });
    });
  }

  /* ------------------------------- RESERVAS ------------------------------- */

  function initBookingsTab() {
    loadBookings();
    $('#bookingsFilter').addEventListener('change', loadBookings);
  }

  async function loadBookings() {
    const list = $('#bookingsList');
    const filter = $('#bookingsFilter').value;
    let query = supabaseClient.from('bookings').select('*');

    if (filter === 'upcoming') {
      query = query.gte('date', toISODate(new Date())).neq('status', 'cancelada').order('date', { ascending: true }).order('time', { ascending: true });
    } else if (filter === 'cancelada') {
      query = query.eq('status', 'cancelada').order('date', { ascending: false });
    } else {
      query = query.order('date', { ascending: false }).order('time', { ascending: true });
    }

    const { data, error } = await query;
    if (error) { list.innerHTML = `<p class="admin-list-empty">Error: ${error.message}</p>`; return; }
    if (!data.length) { list.innerHTML = `<p class="admin-list-empty">No hay reservas para mostrar.</p>`; return; }

    list.innerHTML = data.map(b => `
      <div class="admin-list-item booking-card" data-id="${b.id}">
        <div class="booking-card__top">
          <div class="booking-card__title">${b.date} · ${b.time} — <span>${b.service_name}</span></div>
          <div class="booking-card__meta">${money(b.price)}${b.amount_paid ? ` (pagado ${money(b.amount_paid)})` : ''}</div>
        </div>
        <div class="booking-card__meta">${b.customer_name} · ${b.phone} · ${b.email}</div>
        ${b.notes ? `<div class="booking-card__meta">📝 ${b.notes}</div>` : ''}
        <div class="booking-card__controls">
          <label>Pago:
            <select data-field="payment_status">
              <option value="Pendiente" ${b.payment_status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
              <option value="Pagado" ${b.payment_status === 'Pagado' ? 'selected' : ''}>Pagado</option>
              <option value="Pendiente de confirmación (transferencia)" ${b.payment_status.includes('transferencia') ? 'selected' : ''}>Pendiente transferencia</option>
            </select>
          </label>
          <label>Estado:
            <select data-field="status">
              <option value="confirmada" ${b.status === 'confirmada' ? 'selected' : ''}>Confirmada</option>
              <option value="completada" ${b.status === 'completada' ? 'selected' : ''}>Completada</option>
              <option value="cancelada" ${b.status === 'cancelada' ? 'selected' : ''}>Cancelada</option>
            </select>
          </label>
        </div>
        <div class="booking-card__actions">
          <button class="btn btn--outline btn--sm" data-wa-confirm>📲 Confirmación</button>
          <button class="btn btn--outline btn--sm" data-wa-remind>📲 Recordatorio</button>
          <button class="btn btn--outline btn--sm" data-wa-custom-toggle>💬 Mensaje libre</button>
          <button class="btn btn--outline btn--sm" data-delete>🗑️ Eliminar</button>
        </div>
        <div class="booking-card__whatsapp-custom" data-wa-custom-box>
          <textarea rows="2" placeholder="Escribe tu mensaje…"></textarea>
          <button class="btn btn--accent btn--sm" data-wa-custom-send>Enviar</button>
        </div>
      </div>
    `).join('');

    $$('.booking-card', list).forEach(card => {
      const id = card.dataset.id;
      const booking = data.find(b => b.id === id);

      $$('select[data-field]', card).forEach(sel => {
        sel.addEventListener('change', async () => {
          const field = sel.dataset.field;
          const { error } = await supabaseClient.from('bookings').update({ [field]: sel.value }).eq('id', id);
          if (error) { toast('Error al actualizar: ' + error.message); return; }
          toast('✅ Reserva actualizada');
        });
      });

      $('[data-wa-confirm]', card).addEventListener('click', () => window.open(waLink(booking.phone, msgConfirmacion(booking)), '_blank'));
      $('[data-wa-remind]', card).addEventListener('click', () => window.open(waLink(booking.phone, msgRecordatorio(booking)), '_blank'));

      const customBox = $('[data-wa-custom-box]', card);
      $('[data-wa-custom-toggle]', card).addEventListener('click', () => customBox.classList.toggle('is-open'));
      $('[data-wa-custom-send]', card).addEventListener('click', () => {
        const text = $('textarea', customBox).value.trim();
        if (!text) return;
        window.open(waLink(booking.phone, text), '_blank');
        customBox.classList.remove('is-open');
        $('textarea', customBox).value = '';
      });

      $('[data-delete]', card).addEventListener('click', async () => {
        if (!confirm('¿Eliminar esta reserva? Esta acción no se puede deshacer.')) return;
        const { error } = await supabaseClient.from('bookings').delete().eq('id', id);
        if (error) { toast('Error al eliminar: ' + error.message); return; }
        loadBookings();
      });
    });
  }

  /* ------------------------------- FOTOS ------------------------------- */

  async function uploadPhoto(file, pathPrefix) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${pathPrefix}/${Date.now()}.${ext}`;
    const { error } = await supabaseClient.storage.from('photos').upload(path, file, { upsert: true, cacheControl: '3600' });
    if (error) throw error;
    const { data } = supabaseClient.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
  }

  function initPhotosTab() {
    loadPhotosTab();

    $('#barberPhotoInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      toast('Subiendo foto…');
      try {
        const url = await uploadPhoto(file, 'barbero');
        const { error } = await supabaseClient.from('settings').update({ barber_photo_url: url }).eq('id', 1);
        if (error) throw error;
        $('#barberPhotoPreview').src = url;
        toast('✅ Foto del barbero actualizada');
      } catch (err) {
        toast('Error al subir la foto: ' + err.message);
      }
      e.target.value = '';
    });
  }

  async function loadPhotosTab() {
    const { data: settings, error: settingsError } = await supabaseClient.from('settings').select('*').eq('id', 1).single();
    if (!settingsError && settings) $('#barberPhotoPreview').src = settings.barber_photo_url || '';

    const grid = $('#servicesPhotoGrid');
    const { data: services, error } = await supabaseClient.from('services').select('*').order('sort_order', { ascending: true });
    if (error) { grid.innerHTML = `<p class="admin-list-empty">Error: ${error.message}</p>`; return; }

    grid.innerHTML = services.map(s => `
      <div class="admin-service-photo-card" data-id="${s.id}">
        <img src="${s.photo_url || ''}" alt="${s.name}" onerror="this.style.opacity=0">
        <h4>${s.icon || ''} ${s.name}</h4>
        <label class="btn btn--outline btn--sm admin-upload-btn">
          Cambiar foto
          <input type="file" accept="image/*" hidden>
        </label>
      </div>
    `).join('');

    $$('.admin-service-photo-card', grid).forEach(card => {
      const id = card.dataset.id;
      $('input[type=file]', card).addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        toast('Subiendo foto…');
        try {
          const url = await uploadPhoto(file, 'servicios/' + id);
          const { error } = await supabaseClient.from('services').update({ photo_url: url }).eq('id', id);
          if (error) throw error;
          $('img', card).src = url;
          $('img', card).style.opacity = 1;
          toast('✅ Foto de servicio actualizada');
        } catch (err) {
          toast('Error al subir la foto: ' + err.message);
        }
        e.target.value = '';
      });
    });
  }

  /* ------------------------------- Init ------------------------------- */

  document.addEventListener('DOMContentLoaded', initAuth);
})();
