import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm';

const portal = createClient('https://mkyzpdrcbrttifvveywl.supabase.co', 'sb_publishable_LhdSwoOA4oayVkiwM1CvNQ_eo_xoCdd', {
  auth: { flowType: 'pkce', storageKey: 'umec-clientes' }
});
const $ = id => document.getElementById(id);
const booking = $('booking');
const dateFormat = new Intl.DateTimeFormat('es-ES', { dateStyle: 'full', timeZone: 'Europe/Madrid' });
const madridToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
const addDays = (date, count) => {
  const day = new Date(date + 'T12:00:00Z');
  day.setUTCDate(day.getUTCDate() + count);
  return day.toISOString().slice(0, 10);
};
const pretty = date => dateFormat.format(new Date(date + 'T12:00:00Z'));
const callback = new URL('./citas.html', location.href).href;
const callbacks = new URLSearchParams(location.search);
const callbackError = callbacks.has('error') || new URLSearchParams(location.hash.slice(1)).has('error');
const labels = { pending: 'Pendiente de confirmación', pendiente: 'Pendiente de confirmación',
  rejected: 'Rechazada', asignado: 'Confirmada', 'en curso': 'En curso', completado: 'Completada',
  incidencia: 'Incidencia', cancelado: 'Cancelada' };
let first = madridToday();
let available = {};
let generation = 0;
let currentUser = null;
let attempt = null;

function message(text, error = false) {
  $('status').textContent = text;
  $('status').classList.toggle('error', error);
}
async function rpc(name, params) {
  const { data, error } = await portal.rpc('umec2_web_' + name, params);
  if (error) throw error;
  return data;
}
function choices(select, values, label = String) {
  select.replaceChildren(...values.map(value => new Option(label(value), value)));
}
function showHours() {
  const hours = available[booking.day.value] || [];
  choices(booking.start, hours);
  $('request').disabled = hours.length === 0;
}
function drawCalendar() {
  choices(booking.day, Object.keys(available).sort(), pretty);
  showHours();
  $('range').textContent = pretty(first) + ' a ' + pretty(minDate(addDays(first, 30), addDays(madridToday(), 90)));
  $('prev').disabled = first <= madridToday();
  $('next').disabled = addDays(first, 31) > addDays(madridToday(), 90);
}
const minDate = (a, b) => a < b ? a : b;

async function loadCalendar(announce = true) {
  const version = ++generation;
  available = {};
  drawCalendar();
  try {
    const data = await rpc('availability', { p_first: first, p_minutes: Number(booking.minutes.value) });
    if (version !== generation) return;
    available = data;
    drawCalendar();
    if (announce) message(Object.keys(data).length ? '' : 'No hay horarios para esas fechas y duración.');
  } catch {
    if (version === generation) message('No se pudo consultar la disponibilidad. Pulsa «Actualizar horarios».', true);
  }
}
function setDurations() {
  const previous = booking.minutes.value;
  const lengths = Array.from({ length: Number(booking.pack.value) * 2 }, (_, i) => (i + 1) * 30);
  choices(booking.minutes, lengths, n => n + ' min');
  booking.minutes.value = lengths.includes(Number(previous)) ? previous : '60';
}
async function history() {
  const account = currentUser;
  try {
    const items = await rpc('mine');
    if (account !== currentUser) return;
    $('items').replaceChildren(...items.map(item => {
      const row = document.createElement('li');
      row.textContent = pretty(item.day) + ' a las ' + item.start + ' · ' + item.minutes +
        ' min · Pack ' + item.pack + ' h · ' + (labels[item.status] || 'En revisión');
      return row;
    }));
    $('history-note').textContent = items.length ? '' : 'Aún no tienes solicitudes.';
  } catch {
    if (account === currentUser) $('history-note').textContent = 'No se pudo cargar el historial. Vuelve a intentarlo.';
  }
}
async function showSession(session) {
  currentUser = session?.user.id || null;
  generation++;
  $('auth').hidden = Boolean(session);
  $('account').hidden = !session;
  $('items').replaceChildren();
  $('history-note').textContent = '';
  booking.hidden = true;
  if (!session) {
    booking.reset();
    attempt = null;
    message(callbackError ? 'El enlace de acceso ha caducado o se ha cancelado. Solicita otro.' : '', callbackError);
    return;
  }
  $('email-label').textContent = session.user.email || '';
  const requestedPack = callbacks.get('pack');
  if (['3', '6', '12'].includes(requestedPack)) booking.pack.value = requestedPack;
  setDurations();
  first = madridToday();
  const account = currentUser;
  const historyLoad = history();
  try {
    const settings = await rpc('settings');
    if (account !== currentUser) return;
    if (!settings.enabled || !settings.methods.length) {
      message('La agenda online está cerrada. Puedes contactar con nosotros desde la página principal.');
      return;
    }
    choices(booking.method, settings.methods);
    booking.hidden = false;
    await loadCalendar();
  } catch {
    if (account === currentUser) message('No se pudo abrir la agenda. Recarga la página para volver a intentarlo.', true);
  } finally {
    await historyLoad;
  }
}
async function authAction(button, action, success) {
  button.disabled = true;
  message('');
  try {
    const { error } = await action();
    if (error) throw error;
    if (success) message(success);
  } catch {
    message('No se pudo completar el acceso. Comprueba los datos o inténtalo más tarde.', true);
  } finally {
    button.disabled = false;
  }
}
$('google').onclick = event => authAction(event.currentTarget,
  () => portal.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callback } }));
$('email-form').onsubmit = event => {
  event.preventDefault();
  const email = new FormData(event.currentTarget).get('email').trim();
  authAction(event.submitter, () => portal.auth.signInWithOtp({ email, options: { emailRedirectTo: callback } }),
    'Revisa tu correo y abre el enlace desde este mismo navegador.');
};
$('logout').onclick = event => authAction(event.currentTarget, async () => {
  message('');
  return portal.auth.signOut({ scope: 'local' });
});
$('reload-history').onclick = history;
booking.pack.onchange = () => { setDurations(); loadCalendar(); };
booking.minutes.onchange = () => loadCalendar();
booking.day.onchange = showHours;
$('reload-calendar').onclick = () => loadCalendar();
$('prev').onclick = () => {
  const prior = addDays(first, -31);
  first = prior < madridToday() ? madridToday() : prior;
  loadCalendar();
};
$('next').onclick = () => { first = addDays(first, 31); loadCalendar(); };
booking.onsubmit = async event => {
  event.preventDefault();
  const fields = booking.querySelector('fieldset');
  const account = currentUser;
  const values = Object.fromEntries(new FormData(booking));
  const signature = JSON.stringify(values);
  if (attempt?.signature !== signature) attempt = { signature, id: crypto.randomUUID() };
  fields.disabled = true;
  $('logout').disabled = true;
  message('Enviando solicitud…');
  try {
    await rpc('book', {
      p_request: attempt.id, p_pack: Number(values.pack), p_minutes: Number(values.minutes),
      p_day: values.day, p_start: values.start, p_method: values.method, p_name: values.full_name,
      p_phone: values.phone, p_address: values.address, p_zone: values.zone, p_beneficiary: values.beneficiary
    });
    if (account !== currentUser) return;
    attempt = null;
    message('Reserva pendiente de confirmación.');
    $('status').scrollIntoView({ block: 'nearest' });
    await history();
  } catch (error) {
    if (account !== currentUser) return;
    message(error.code === 'P0001' ? error.message : 'No se pudo enviar la solicitud. Puedes volver a intentarlo.', true);
    $('status').scrollIntoView({ block: 'nearest' });
    if (error.code === 'P0001') await loadCalendar(false);
  } finally {
    fields.disabled = false;
    $('logout').disabled = false;
  }
};
portal.auth.onAuthStateChange((event, session) => {
  if (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT' ||
      (event === 'SIGNED_IN' && session?.user.id !== currentUser)) {
    setTimeout(() => showSession(session), 0);
  }
});
