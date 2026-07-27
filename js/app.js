(function () {
  'use strict';

  /* ----------------------------- Utilidades ----------------------------- */

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const money = (n) => '$' + n.toLocaleString('es-CL');

  const pad2 = (n) => String(n).padStart(2, '0');
  const toISODate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  function toast(msg, ms) {
    const container = $('#toast-container');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), ms || 3800);
  }

  function isSupabaseConfigured() {
    return typeof SUPABASE_URL === 'string' && !SUPABASE_URL.includes('TU-PROYECTO') && !SUPABASE_ANON_KEY.includes('TU-ANON-KEY');
  }

  /* --------------------------- Datos remotos (Supabase) -------------------------- */

  let SERVICES = [];
  let GALLERY = [];
  let SETTINGS = {};
  let BLOCKED_DATES = []; // array de 'YYYY-MM-DD'

  async function loadRemoteData() {
    if (!isSupabaseConfigured()) {
      SERVICES = FALLBACK_SERVICES;
      GALLERY = FALLBACK_GALLERY;
      SETTINGS = FALLBACK_SETTINGS;
      BLOCKED_DATES = [];
      toast('⚠️ Supabase no está configurado todavía (js/config.js). Mostrando datos de ejemplo.', 6000);
      return;
    }
    try {
      const [servicesRes, galleryRes, settingsRes, blockedRes] = await Promise.all([
        supabaseClient.from('services').select('*').order('sort_order', { ascending: true }),
        supabaseClient.from('gallery').select('*').order('sort_order', { ascending: true }),
        supabaseClient.from('settings').select('*').eq('id', 1).single(),
        supabaseClient.from('blocked_dates').select('date'),
      ]);
      if (servicesRes.error) throw servicesRes.error;
      if (galleryRes.error) throw galleryRes.error;
      if (settingsRes.error) throw settingsRes.error;
      if (blockedRes.error) throw blockedRes.error;

      SERVICES = servicesRes.data.length ? servicesRes.data : FALLBACK_SERVICES;
      GALLERY = galleryRes.data.length ? galleryRes.data : FALLBACK_GALLERY;
      SETTINGS = settingsRes.data || FALLBACK_SETTINGS;
      BLOCKED_DATES = (blockedRes.data || []).map(b => b.date);
    } catch (err) {
      console.error('Error cargando datos de Supabase, usando datos de ejemplo:', err);
      SERVICES = FALLBACK_SERVICES;
      GALLERY = FALLBACK_GALLERY;
      SETTINGS = FALLBACK_SETTINGS;
      BLOCKED_DATES = [];
      toast('⚠️ No se pudo conectar con Supabase. Mostrando datos de ejemplo.', 6000);
    }
  }

  /* --------------------------- "Mis reservas" (recibos locales) -------------------------- */

  const STORAGE_KEY = 'mashita_my_bookings_v1';

  function getMyBookings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveMyBooking(booking) {
    const all = getMyBookings();
    all.push(booking);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  /* ----------------------------- Render estático ---------------------------- */

  function renderServices() {
    const grid = $('#servicesGrid');
    grid.innerHTML = SERVICES.map(s => `
      <div class="service-card">
        ${s.photo_url ? `<div class="service-card__photo"><img class="photo-real" src="${s.photo_url}" alt="${s.name}" loading="lazy"></div>` : ''}
        <div class="service-card__icon">${s.icon || '💈'}</div>
        <h3>${s.name}</h3>
        <p>${s.description}</p>
        <div class="service-card__meta">
          <span class="service-card__price">${money(s.price)}</span>
          <span class="service-card__duration">${s.duration} min</span>
        </div>
      </div>
    `).join('');
  }

  function renderGallery() {
    const grid = $('#galleryGrid');
    grid.innerHTML = GALLERY.map(g => `
      <div class="gallery-item" data-label="${g.label}">
        <img class="photo-real" src="${g.photo_url}" alt="${g.label} — trabajo realizado en Mashita Barber" loading="lazy">
      </div>
    `).join('');
  }

  function renderTestimonials() {
    const grid = $('#testimonialGrid');
    grid.innerHTML = TESTIMONIALS.map(t => `
      <div class="testimonial-card">
        <div class="testimonial-card__stars">${'★'.repeat(t.stars)}</div>
        <p>${t.text}</p>
        <div class="testimonial-card__foot">
          <img class="testimonial-card__avatar photo-real" src="${t.avatar}" alt="Foto de ${t.name}" loading="lazy">
          <div class="testimonial-card__name">${t.name}</div>
        </div>
      </div>
    `).join('');
  }

  function renderBarberProfile() {
    const heroImg = $('#heroPhotoImg');
    const barberoImg = $('#barberoPhotoImg');
    if (heroImg && SETTINGS.barber_photo_url) heroImg.src = SETTINGS.barber_photo_url;
    if (barberoImg && SETTINGS.barber_photo_url) barberoImg.src = SETTINGS.barber_photo_url;

    const nameEl = $('#barberoName');
    const bioEl = $('#barberoBio');
    const tagsEl = $('#barberoTags');
    if (nameEl) nameEl.textContent = SETTINGS.barber_name || 'Mashita';
    if (bioEl) bioEl.textContent = SETTINGS.barber_bio || '';
    if (tagsEl && SETTINGS.barber_tags) {
      tagsEl.innerHTML = SETTINGS.barber_tags.map(t => `<li>${t}</li>`).join('');
    }
  }

  function renderBankInfo() {
    const box = $('#transferBox');
    const b = SETTINGS.bank_info || {};
    if (!box) return;
    box.innerHTML = `
      <p><strong>Banco:</strong> ${b.bank || ''}</p>
      <p><strong>Tipo de cuenta:</strong> ${b.accountType || ''}</p>
      <p><strong>N° de cuenta:</strong> ${b.accountNumber || ''}</p>
      <p><strong>Titular:</strong> ${b.holder || ''}</p>
      <p><strong>RUT:</strong> ${b.rut || ''}</p>
      <p><strong>Email confirmación:</strong> ${b.email || ''}</p>
      <button class="btn btn--outline btn--sm" type="button" id="copyTransfer">📋 Copiar datos</button>
    `;
    $('#copyTransfer').addEventListener('click', () => {
      const text = `Banco: ${b.bank}\nTipo de cuenta: ${b.accountType}\nN° cuenta: ${b.accountNumber}\nTitular: ${b.holder}\nRUT: ${b.rut}\nEmail: ${b.email}`;
      navigator.clipboard.writeText(text).then(() => toast('Datos bancarios copiados 📋')).catch(() => toast('No se pudo copiar automáticamente, cópialos manualmente.'));
    });
  }

  /* ------------------------------- Navbar ------------------------------- */

  function initNavbar() {
    const burger = $('#burgerBtn');
    const links = $('#navLinks');
    burger.addEventListener('click', () => {
      links.classList.toggle('is-open');
      links.style.display = links.classList.contains('is-open') ? 'flex' : '';
      if (links.classList.contains('is-open')) {
        links.style.position = 'fixed';
        links.style.top = '64px';
        links.style.left = '0';
        links.style.right = '0';
        links.style.background = 'var(--bg-alt)';
        links.style.flexDirection = 'column';
        links.style.padding = '1.5rem';
        links.style.borderBottom = '1px solid var(--border)';
      }
    });
    $$('#navLinks a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('is-open');
      links.style.display = '';
    }));
  }

  /* ------------------------------- Wizard state ------------------------------- */

  const state = {
    step: 1,
    service: null,
    date: null, // Date object
    time: null, // 'HH:MM'
    calendarMonth: (() => { const d = new Date(); d.setDate(1); return d; })(),
    payMode: 'full',
    payMethod: 'card',
  };

  function resetWizard() {
    state.step = 1;
    state.service = null;
    state.date = null;
    state.time = null;
    state.calendarMonth = (() => { const d = new Date(); d.setDate(1); return d; })();
    state.payMode = 'full';
    state.payMethod = 'card';
    $('#contactForm').reset();
    $('#cardForm').reset();
    $$('.option-card').forEach(c => c.classList.remove('is-selected'));
    $('#toStep2').disabled = true;
    goToStep(1);
  }

  function goToStep(n) {
    state.step = n;
    $$('.wizard__step').forEach(el => {
      const step = Number(el.dataset.step);
      el.classList.toggle('is-active', step === n);
      el.classList.toggle('is-done', step < n);
    });
    $$('.wizard__panel').forEach(el => {
      el.classList.toggle('is-active', Number(el.dataset.panel) === n);
    });
    if (n === 2) renderCalendar();
    if (n === 4) renderPaySummary();
  }

  /* ------------------------------- Paso 1: Servicio ------------------------------- */

  function renderServiceOptions() {
    const wrap = $('#serviceOptions');
    wrap.innerHTML = SERVICES.map(s => `
      <div class="option-card" data-id="${s.id}">
        <div style="font-size:1.4rem">${s.icon || '💈'}</div>
        <h4>${s.name}</h4>
        <p>${s.description}</p>
        <div class="option-card__foot"><b>${money(s.price)}</b><span>${s.duration} min</span></div>
      </div>
    `).join('');
    $$('.option-card', wrap).forEach(card => {
      card.addEventListener('click', () => {
        $$('.option-card', wrap).forEach(c => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        state.service = SERVICES.find(s => s.id === card.dataset.id);
        $('#toStep2').disabled = false;
      });
    });
  }

  /* ------------------------------- Paso 2: Calendario ------------------------------- */

  function isClosedDay(date) {
    return (SETTINGS.closed_days || []).includes(date.getDay());
  }

  function isBlocked(date) {
    return BLOCKED_DATES.includes(toISODate(date));
  }

  function isPast(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  function isTooFar(date) {
    const max = new Date();
    max.setDate(max.getDate() + 45);
    return date > max;
  }

  function renderCalendar() {
    const wrap = $('#calendarWrap');
    const monthDate = state.calendarMonth;
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let cells = '';
    for (let i = 0; i < firstDow; i++) cells += `<div class="calendar__day is-empty"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const disabled = isClosedDay(date) || isPast(date) || isTooFar(date) || isBlocked(date);
      const selected = state.date && toISODate(state.date) === toISODate(date);
      cells += `<div class="calendar__day ${disabled ? 'is-disabled' : ''} ${selected ? 'is-selected' : ''}" data-date="${toISODate(date)}">${d}</div>`;
    }

    wrap.innerHTML = `
      <div class="calendar__header">
        <button class="btn btn--ghost btn--sm" id="prevMonth" type="button">←</button>
        <span>${MONTHS[month]} ${year}</span>
        <button class="btn btn--ghost btn--sm" id="nextMonth" type="button">→</button>
      </div>
      <div class="calendar__grid">
        ${DOW.map(d => `<div class="calendar__dow">${d}</div>`).join('')}
        ${cells}
      </div>
    `;

    $('#prevMonth').addEventListener('click', () => {
      const d = new Date(state.calendarMonth);
      d.setMonth(d.getMonth() - 1);
      state.calendarMonth = d;
      renderCalendar();
    });
    $('#nextMonth').addEventListener('click', () => {
      const d = new Date(state.calendarMonth);
      d.setMonth(d.getMonth() + 1);
      state.calendarMonth = d;
      renderCalendar();
    });
    $$('.calendar__day:not(.is-disabled):not(.is-empty)', wrap).forEach(cell => {
      cell.addEventListener('click', () => {
        state.date = new Date(cell.dataset.date + 'T00:00:00');
        state.time = null;
        renderCalendar();
        renderSlots();
        $('#toStep3').disabled = true;
      });
    });

    renderSlots();
  }

  function timeToMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }
  function minutesToTime(mins) {
    return `${pad2(Math.floor(mins / 60))}:${pad2(mins % 60)}`;
  }

  async function getBookedRangesForDate(isoDate) {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await supabaseClient.from('bookings_public').select('time,duration').eq('date', isoDate);
      if (error) throw error;
      return (data || []).map(b => {
        const start = timeToMinutes(b.time);
        return { start, end: start + b.duration };
      });
    } catch (err) {
      console.error('Error consultando disponibilidad:', err);
      return [];
    }
  }

  async function renderSlots() {
    const wrap = $('#slotsWrap');
    if (!state.date) {
      wrap.innerHTML = `<p class="slots-empty">Elige primero un día en el calendario.</p>`;
      return;
    }
    wrap.innerHTML = `<p class="slots-empty">Cargando horarios disponibles…</p>`;

    const duration = state.service.duration;
    const iso = toISODate(state.date);
    const booked = await getBookedRangesForDate(iso);

    // si el usuario ya cambió de fecha mientras esperábamos la respuesta, no pisar la UI
    if (!state.date || toISODate(state.date) !== iso) return;

    const startMin = (SETTINGS.start_hour ?? 10) * 60;
    const endMin = (SETTINGS.end_hour ?? 19) * 60;
    const now = new Date();
    const isToday = toISODate(now) === iso;
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const slots = [];
    for (let t = startMin; t + duration <= endMin; t += 30) {
      if (isToday && t <= nowMin + 30) continue; // requiere al menos 30 min de anticipación
      const overlaps = booked.some(r => t < r.end && (t + duration) > r.start);
      if (!overlaps) slots.push(t);
    }

    if (slots.length === 0) {
      wrap.innerHTML = `<p class="slots-empty">No quedan horas disponibles ese día para este servicio. Prueba otra fecha.</p>`;
      return;
    }

    wrap.innerHTML = slots.map(t => {
      const label = minutesToTime(t);
      const selected = state.time === label;
      return `<div class="slot-btn ${selected ? 'is-selected' : ''}" data-time="${label}">${label}</div>`;
    }).join('');

    $$('.slot-btn', wrap).forEach(btn => {
      btn.addEventListener('click', () => {
        state.time = btn.dataset.time;
        $$('.slot-btn', wrap).forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        $('#toStep3').disabled = false;
      });
    });
  }

  /* ------------------------------- Paso 4: Pago ------------------------------- */

  function renderPaySummary() {
    const box = $('#paySummary');
    const price = state.service.price;
    const amount = state.payMode === 'deposit' ? Math.round(price * 0.3) : price;
    box.innerHTML = `
      <div><span>Servicio</span><span>${state.service.name}</span></div>
      <div><span>Fecha</span><span>${toISODate(state.date)} · ${state.time}</span></div>
      <div><span>Duración</span><span>${state.service.duration} min</span></div>
      <div><span>Precio total</span><span>${money(price)}</span></div>
      <div class="total"><span>${state.payMode === 'deposit' ? 'Abono a pagar (30%)' : 'A pagar ahora'}</span><span>${money(amount)}</span></div>
    `;
  }

  function luhnValid(num) {
    const digits = num.replace(/\D/g, '');
    if (digits.length < 13) return false;
    let sum = 0, alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = Number(digits[i]);
      if (alt) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  function initPaymentControls() {
    $$('.pay-toggle input[name="payMode"]').forEach(r => {
      r.addEventListener('change', () => {
        state.payMode = r.value;
        renderPaySummary();
      });
    });

    $$('.method-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.method-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        state.payMethod = btn.dataset.method;
        $$('.pay-panel').forEach(p => {
          p.style.display = p.dataset.pay === state.payMethod ? 'block' : 'none';
        });
      });
    });

    const cardNumberInput = $('input[name="cardNumber"]');
    cardNumberInput.addEventListener('input', () => {
      let v = cardNumberInput.value.replace(/\D/g, '').slice(0, 16);
      cardNumberInput.value = v.replace(/(.{4})/g, '$1 ').trim();
    });
    const expiryInput = $('input[name="cardExpiry"]');
    expiryInput.addEventListener('input', () => {
      let v = expiryInput.value.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
      expiryInput.value = v;
    });
    const cvvInput = $('input[name="cardCvv"]');
    cvvInput.addEventListener('input', () => {
      cvvInput.value = cvvInput.value.replace(/\D/g, '').slice(0, 4);
    });
  }

  /* ------------------------------- ICS (calendario) ------------------------------- */

  function downloadICS(booking) {
    const [h, m] = booking.time.split(':').map(Number);
    const start = new Date(booking.date + 'T00:00:00');
    start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + booking.duration * 60000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mashita Barber//ES',
      'BEGIN:VEVENT',
      `UID:${booking.id}@mashitabarber.cl`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${booking.service_name} — Mashita Barber`,
      `DESCRIPTION:Reserva confirmada en Mashita Barber. Servicio: ${booking.service_name}.`,
      'LOCATION:Av. Providencia 1234, Santiago',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reserva-mashita-barber.ics';
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ------------------------------- Confirmación ------------------------------- */

  async function confirmBooking() {
    const form = $('#contactForm');
    if (!form.reportValidity()) { goToStep(3); return; }
    const fd = new FormData(form);

    if (state.payMethod === 'card') {
      const cardForm = $('#cardForm');
      const cardNumber = cardForm.cardNumber.value;
      const expiry = cardForm.cardExpiry.value;
      const cvv = cardForm.cardCvv.value;
      if (!cardForm.cardName.value.trim() || !luhnValid(cardNumber) || !/^\d{2}\/\d{2}$/.test(expiry) || cvv.length < 3) {
        toast('Revisa los datos de tu tarjeta ⚠️');
        return;
      }
    }

    const price = state.service.price;
    const amount = state.payMode === 'deposit' ? Math.round(price * 0.3) : price;
    const paid = state.payMethod === 'card';

    const bookingPayload = {
      service_id: state.service.id,
      service_name: state.service.name,
      duration: state.service.duration,
      price,
      amount_paid: paid ? amount : 0,
      date: toISODate(state.date),
      time: state.time,
      customer_name: fd.get('name'),
      phone: fd.get('phone'),
      email: fd.get('email'),
      notes: fd.get('notes') || '',
      reminder: fd.get('reminder') === 'on',
      pay_mode: state.payMode,
      pay_method: state.payMethod,
      payment_status: paid ? 'Pagado' : 'Pendiente de confirmación (transferencia)',
      status: 'confirmada',
    };

    const confirmBtn = $('#confirmPay');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Procesando…';

    let saved = { ...bookingPayload, id: 'local-' + Date.now(), created_at: new Date().toISOString() };
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabaseClient.from('bookings').insert(bookingPayload).select().single();
        if (error) throw error;
        saved = data;
      }
      saveMyBooking(saved);
      renderFinal(saved);
      goToStep(5);
    } catch (err) {
      console.error('Error guardando la reserva:', err);
      toast('No se pudo confirmar la reserva. Intenta de nuevo. ⚠️');
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirmar y pagar →';
    }
  }

  function renderFinal(booking) {
    $('#finalSummary').innerHTML = `
      <div><span>Servicio</span><span>${booking.service_name}</span></div>
      <div><span>Fecha</span><span>${booking.date} · ${booking.time}</span></div>
      <div><span>Cliente</span><span>${booking.customer_name}</span></div>
      <div><span>Estado de pago</span><span>${booking.payment_status}</span></div>
      <div class="total"><span>Monto</span><span>${money(booking.amount_paid || 0)}</span></div>
    `;

    const reminderBox = $('#reminderList');
    if (booking.reminder) {
      reminderBox.innerHTML = `
        <div>📲 Recordatorio: el barbero podrá enviarte confirmación/recordatorio por WhatsApp desde el panel de administración.</div>
        <div style="font-size:.78rem;opacity:.7">Nota: los recordatorios se envían manualmente por WhatsApp (no automáticos) para no depender de una API de pago (Twilio/WhatsApp Business).</div>
      `;
    } else {
      reminderBox.innerHTML = `<div>No solicitaste recordatorios para esta reserva.</div>`;
    }

    $('#downloadIcs').onclick = () => downloadICS(booking);
  }

  /* ------------------------------- Mis reservas ------------------------------- */

  function renderMisReservas() {
    const list = $('#reservasList');
    const all = getMyBookings().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    if (all.length === 0) {
      list.innerHTML = `<p class="empty-state">Aún no tienes reservas hechas desde este navegador.</p>`;
      return;
    }
    list.innerHTML = all.map(b => `
      <div class="reserva-item">
        <div><strong>${b.service_name}</strong> — ${b.date} · ${b.time}</div>
        <div>${b.customer_name} · ${b.phone}</div>
        <span class="reserva-item__status">${b.payment_status}</span>
      </div>
    `).join('');
  }

  /* ------------------------------- Wiring general ------------------------------- */

  function openModal(id) {
    $(id).classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(id) {
    $(id).classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function initWizardWiring() {
    ['#openBookingNav', '#openBookingHero', '#openBookingCta'].forEach(sel => {
      const el = $(sel);
      if (el) el.addEventListener('click', () => { resetWizard(); openModal('#bookingOverlay'); });
    });
    $('#closeBooking').addEventListener('click', () => closeModal('#bookingOverlay'));
    $('#bookingOverlay').addEventListener('click', (e) => { if (e.target.id === 'bookingOverlay') closeModal('#bookingOverlay'); });

    $('#toStep2').addEventListener('click', () => goToStep(2));
    $('#toStep3').addEventListener('click', () => goToStep(3));
    $('#toStep4').addEventListener('click', () => {
      if (!$('#contactForm').reportValidity()) return;
      goToStep(4);
    });
    $('#confirmPay').addEventListener('click', confirmBooking);
    $$('[data-back]').forEach(btn => btn.addEventListener('click', () => goToStep(Number(btn.dataset.back))));
    $('#closeWizardDone').addEventListener('click', () => closeModal('#bookingOverlay'));

    $('#misReservasBtn').addEventListener('click', (e) => {
      e.preventDefault();
      renderMisReservas();
      openModal('#reservasOverlay');
    });
    $('#closeReservas').addEventListener('click', () => closeModal('#reservasOverlay'));
    $('#reservasOverlay').addEventListener('click', (e) => { if (e.target.id === 'reservasOverlay') closeModal('#reservasOverlay'); });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeModal('#bookingOverlay'); closeModal('#reservasOverlay'); }
    });
  }

  /* ------------------------------- Init ------------------------------- */

  document.addEventListener('DOMContentLoaded', async () => {
    await loadRemoteData();
    renderServices();
    renderGallery();
    renderTestimonials();
    renderBarberProfile();
    renderBankInfo();
    renderServiceOptions();
    initPaymentControls();
    initWizardWiring();
    initNavbar();
  });
})();
