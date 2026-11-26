const STORAGE_KEY = 'cambio_al_dia_rates_v1';

const DEFAULT_RATES = {
  bcv: 46.50,
  paralelo: 54.20,
  eur: 49.10,
  usdt: 54.00,
  updatedAt: new Date().toLocaleDateString('es-VE')
};

const RATE_META = {
  bcv: { name: 'BCV Oficial', symbol: '$', code: 'USD', label: 'Monto en Dólares (USD)' },
  paralelo: { name: 'Paralelo', symbol: '$', code: 'USD', label: 'Monto en Dólares (USD)' },
  eur: { name: 'Euro BCV', symbol: '€', code: 'EUR', label: 'Monto en Euros (EUR)' },
  usdt: { name: 'USDT P2P', symbol: '₮', code: 'USDT', label: 'Monto en USDT' }
};

let rates = loadRates();
let selectedRateKey = 'bcv';

const rateCards = document.querySelectorAll('.rate-card');
const foreignInput = document.getElementById('foreign-input');
const vesInput = document.getElementById('ves-input');
const foreignLabel = document.getElementById('foreign-label');
const foreignPrefix = document.getElementById('foreign-prefix');
const activeRateLabel = document.getElementById('active-rate-label');
const sharePreview = document.getElementById('share-preview');
const lastUpdatedEl = document.getElementById('last-updated');

const modal = document.getElementById('settings-modal');
const openSettingsBtn = document.getElementById('open-settings-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const ratesForm = document.getElementById('rates-form');
const resetDefaultsBtn = document.getElementById('reset-defaults-btn');

const copyBtn = document.getElementById('copy-btn');
const whatsappBtn = document.getElementById('whatsapp-btn');
const toast = document.getElementById('toast');

function loadRates() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_RATES, ...JSON.parse(saved) } : { ...DEFAULT_RATES };
  } catch {
    return { ...DEFAULT_RATES };
  }
}

function saveRates(newRates) {
  rates = { ...newRates, updatedAt: new Date().toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' }) };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
  renderRates();
  recalculateFromForeign();
}

function formatBs(value) {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatForeign(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function renderRates() {
  document.getElementById('display-bcv').textContent = `Bs. ${formatBs(rates.bcv)}`;
  document.getElementById('display-paralelo').textContent = `Bs. ${formatBs(rates.paralelo)}`;
  document.getElementById('display-eur').textContent = `Bs. ${formatBs(rates.eur)}`;
  document.getElementById('display-usdt').textContent = `Bs. ${formatBs(rates.usdt)}`;
  lastUpdatedEl.textContent = `Actualizado: ${rates.updatedAt}`;

  const diff = rates.paralelo - rates.bcv;
  const percent = rates.bcv > 0 ? (diff / rates.bcv) * 100 : 0;
  const sign = diff >= 0 ? '+' : '';
  document.getElementById('spread-diff').textContent = `${sign}Bs. ${formatBs(diff)}`;
  document.getElementById('spread-percent').textContent = `${sign}${formatBs(percent)}%`;

  updateSelectedRateUI();
}

function updateSelectedRateUI() {
  const meta = RATE_META[selectedRateKey];
  const currentRate = rates[selectedRateKey];

  rateCards.forEach(card => {
    card.classList.toggle('active', card.dataset.rate === selectedRateKey);
  });

  foreignLabel.textContent = meta.label;
  foreignPrefix.textContent = meta.symbol;
  activeRateLabel.textContent = `Usando: ${meta.name} (Bs. ${formatBs(currentRate)})`;
}

function recalculateFromForeign() {
  const amount = parseFloat(foreignInput.value);
  if (isNaN(amount) || amount <= 0) {
    vesInput.value = '';
    updateSharePreview(0, 0);
    return;
  }
  const ves = amount * rates[selectedRateKey];
  vesInput.value = ves.toFixed(2);
  updateSharePreview(amount, ves);
}

function recalculateFromVes() {
  const ves = parseFloat(vesInput.value);
  if (isNaN(ves) || ves <= 0) {
    foreignInput.value = '';
    updateSharePreview(0, 0);
    return;
  }
  const amount = ves / rates[selectedRateKey];
  foreignInput.value = amount.toFixed(2);
  updateSharePreview(amount, ves);
}

function buildShareMessage(amount, ves) {
  const meta = RATE_META[selectedRateKey];
  const rate = rates[selectedRateKey];
  return (
    `💱 *Cálculo CambioAlDía*\n` +
    `• Monto: *${meta.symbol}${formatForeign(amount)} ${meta.code}*\n` +
    `• Tasa (${meta.name}): *Bs. ${formatBs(rate)}*\n` +
    `• Total a pagar: *Bs. ${formatBs(ves)}*`
  );
}

function updateSharePreview(amount, ves) {
  if (!amount || !ves) {
    sharePreview.textContent = 'Ingresa un monto para generar el resumen listo para enviar.';
    return;
  }
  sharePreview.textContent = buildShareMessage(amount, ves).replace(/\*/g, '');
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2200);
}

rateCards.forEach(card => {
  card.addEventListener('click', () => {
    selectedRateKey = card.dataset.rate;
    updateSelectedRateUI();
    if (foreignInput.value) {
      recalculateFromForeign();
    } else if (vesInput.value) {
      recalculateFromVes();
    }
  });
});

foreignInput.addEventListener('input', recalculateFromForeign);
vesInput.addEventListener('input', recalculateFromVes);

document.getElementById('clear-foreign').addEventListener('click', () => {
  foreignInput.value = '';
  vesInput.value = '';
  updateSharePreview(0, 0);
  foreignInput.focus();
});

document.getElementById('clear-ves').addEventListener('click', () => {
  foreignInput.value = '';
  vesInput.value = '';
  updateSharePreview(0, 0);
  vesInput.focus();
});

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    foreignInput.value = chip.dataset.amount;
    recalculateFromForeign();
  });
});

copyBtn.addEventListener('click', async () => {
  const amount = parseFloat(foreignInput.value);
  const ves = parseFloat(vesInput.value);
  if (!amount || !ves) {
    showToast('Ingresa un monto primero');
    return;
  }
  await navigator.clipboard.writeText(buildShareMessage(amount, ves));
  showToast('¡Resumen copiado!');
});

whatsappBtn.addEventListener('click', () => {
  const amount = parseFloat(foreignInput.value);
  const ves = parseFloat(vesInput.value);
  if (!amount || !ves) {
    showToast('Ingresa un monto primero');
    return;
  }
  const url = `https://wa.me/?text=${encodeURIComponent(buildShareMessage(amount, ves))}`;
  window.open(url, '_blank', 'noopener,noreferrer');
});

openSettingsBtn.addEventListener('click', () => {
  document.getElementById('input-bcv').value = rates.bcv;
  document.getElementById('input-paralelo').value = rates.paralelo;
  document.getElementById('input-eur').value = rates.eur;
  document.getElementById('input-usdt').value = rates.usdt;
  modal.classList.remove('hidden');
});

closeSettingsBtn.addEventListener('click', () => modal.classList.add('hidden'));

modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.add('hidden');
});

ratesForm.addEventListener('submit', (e) => {
  e.preventDefault();
  saveRates({
    bcv: parseFloat(document.getElementById('input-bcv').value),
    paralelo: parseFloat(document.getElementById('input-paralelo').value),
    eur: parseFloat(document.getElementById('input-eur').value),
    usdt: parseFloat(document.getElementById('input-usdt').value)
  });
  modal.classList.add('hidden');
  showToast('Tasas actualizadas');
});

resetDefaultsBtn.addEventListener('click', () => {
  saveRates(DEFAULT_RATES);
  modal.classList.add('hidden');
  showToast('Tasas restauradas');
});

renderRates();
