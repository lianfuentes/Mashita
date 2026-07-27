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

  /* --------------------------- Persistencia local -------------------------- */

  const STORAGE_KEY = 'mashita_bookings_v1';

  function getBookings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveBooking(booking) {
    const all = getBookings();
    all.push(booking);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  /* ----------------------------- Render estático ---------------------------- */

  function renderServices() {
    const grid = $('#servicesGrid');
    grid.innerHTML = SERVICES.map(s => `
      <div class="service-card">
        <div class="service-card__icon">${s.icon}</div>
        <h3>${s.name}</h3>
        <p>${s.desc}</p>
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
        <img class="photo-real" src="${g.img}" alt="${g.label} — trabajo realizado en Mashita Barber" loading="lazy">
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
        <div style="font-size:1.4rem">${s.icon}</div>
        <h4>${s.name}</h4>
        <p>${s.desc}</p>
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
    return BUSINESS_HOURS.closedDays.includes(date.getDay());
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
      const disabled = isClosedDay(date) || isPast(date) || isTooFar(date);
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

  function getBookedRangesForDate(isoDate) {
    return getBookings()
      .filter(b => b.date === isoDate)
      .map(b => {
        const start = timeToMinutes(b.time);
        return { start, end: start + b.duration };
      });
  }

  function renderSlots() {
    const wrap = $('#slotsWrap');
    if (!state.date) {
      wrap.innerHTML = `<p class="slots-empty">Elige primero un día en el calendario.</p>`;
      return;
    }
    const duration = state.service.duration;
    const iso = toISODate(state.date);
    const booked = getBookedRangesForDate(iso);
    const startMin = BUSINESS_HOURS.start * 60;
    const endMin = BUSINESS_HOURS.end * 60;
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

    $('#copyTransfer').addEventListener('click', () => {
      const text = `Banco: ${BANK_INFO.bank}\nTipo de cuenta: ${BANK_INFO.accountType}\nN° cuenta: ${BANK_INFO.accountNumber}\nTitular: ${BANK_INFO.holder}\nRUT: ${BANK_INFO.rut}\nEmail: ${BANK_INFO.email}`;
      navigator.clipboard.writeText(text).then(() => toast('Datos bancarios copiados 📋')).catch(() => toast('No se pudo copiar automáticamente, cópialos manualmente.'));
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
      `SUMMARY:${booking.serviceName} — Mashita Barber`,
      `DESCRIPTION:Reserva confirmada en Mashita Barber. Servicio: ${booking.serviceName}.`,
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

  function confirmBooking() {
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

    const booking = {
      id: 'B' + Date.now(),
      serviceId: state.service.id,
      serviceName: state.service.name,
      duration: state.service.duration,
      price,
      amountPaid: paid ? amount : 0,
      date: toISODate(state.date),
      time: state.time,
      customerName: fd.get('name'),
      phone: fd.get('phone'),
      email: fd.get('email'),
      notes: fd.get('notes') || '',
      reminder: fd.get('reminder') === 'on',
      payMode: state.payMode,
      payMethod: state.payMethod,
      paymentStatus: paid ? 'Pagado' : 'Pendiente de confirmación (transferencia)',
      createdAt: new Date().toISOString(),
    };

    saveBooking(booking);
    renderFinal(booking);
    goToStep(5);
  }

  function renderFinal(booking) {
    $('#finalSummary').innerHTML = `
      <div><span>Servicio</span><span>${booking.serviceName}</span></div>
      <div><span>Fecha</span><span>${booking.date} · ${booking.time}</span></div>
      <div><span>Cliente</span><span>${booking.customerName}</span></div>
      <div><span>Estado de pago</span><span>${booking.paymentStatus}</span></div>
      <div class="total"><span>Monto</span><span>${money(booking.amountPaid || 0)}</span></div>
    `;

    const reminderBox = $('#reminderList');
    if (booking.reminder) {
      reminderBox.innerHTML = `
        <div>📲 Recordatorio simulado: WhatsApp 24h antes de tu cita</div>
        <div>📲 Recordatorio simulado: SMS 2h antes de tu cita</div>
        <div style="font-size:.78rem;opacity:.7">Nota: en esta demo los recordatorios no se envían realmente. Para producción se requiere integrar una API como WhatsApp Business Cloud API, Twilio o similar.</div>
      `;
    } else {
      reminderBox.innerHTML = `<div>No solicitaste recordatorios para esta reserva.</div>`;
    }

    $('#downloadIcs').onclick = () => downloadICS(booking);
  }

  /* ------------------------------- Mis reservas ------------------------------- */

  function renderMisReservas() {
    const list = $('#reservasList');
    const all = getBookings().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    if (all.length === 0) {
      list.innerHTML = `<p class="empty-state">Aún no tienes reservas en este navegador.</p>`;
      return;
    }
    list.innerHTML = all.map(b => `
      <div class="reserva-item">
        <div><strong>${b.serviceName}</strong> — ${b.date} · ${b.time}</div>
        <div>${b.customerName} · ${b.phone}</div>
        <span class="reserva-item__status">${b.paymentStatus}</span>
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

  document.addEventListener('DOMContentLoaded', () => {
    renderServices();
    renderGallery();
    renderTestimonials();
    renderServiceOptions();
    initPaymentControls();
    initWizardWiring();
    initNavbar();
  });
})();
