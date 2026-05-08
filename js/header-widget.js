/**
 * HeaderWidget – Live clock & weather for the top header
 * Uses Open-Meteo API (free, no API key required)
 */

const WMO_CODES = {
  0: { desc: 'Despejado', icon: 'sun' },
  1: { desc: 'Mayormente despejado', icon: 'sun' },
  2: { desc: 'Parcialmente nublado', icon: 'cloud-sun' },
  3: { desc: 'Nublado', icon: 'cloud' },
  45: { desc: 'Niebla', icon: 'cloud' },
  48: { desc: 'Niebla helada', icon: 'cloud' },
  51: { desc: 'Llovizna leve', icon: 'rain' },
  53: { desc: 'Llovizna', icon: 'rain' },
  55: { desc: 'Llovizna intensa', icon: 'rain' },
  56: { desc: 'Llovizna helada', icon: 'rain' },
  57: { desc: 'Llovizna helada intensa', icon: 'rain' },
  61: { desc: 'Lluvia leve', icon: 'rain' },
  63: { desc: 'Lluvia', icon: 'rain' },
  65: { desc: 'Lluvia intensa', icon: 'rain' },
  66: { desc: 'Lluvia helada', icon: 'rain' },
  67: { desc: 'Lluvia helada intensa', icon: 'rain' },
  71: { desc: 'Nieve leve', icon: 'snow' },
  73: { desc: 'Nieve', icon: 'snow' },
  75: { desc: 'Nieve intensa', icon: 'snow' },
  77: { desc: 'Granizo', icon: 'snow' },
  80: { desc: 'Chubascos leves', icon: 'rain' },
  81: { desc: 'Chubascos', icon: 'rain' },
  82: { desc: 'Chubascos intensos', icon: 'rain' },
  85: { desc: 'Chubascos de nieve', icon: 'snow' },
  86: { desc: 'Chubascos de nieve intensos', icon: 'snow' },
  95: { desc: 'Tormenta', icon: 'storm' },
  96: { desc: 'Tormenta con granizo', icon: 'storm' },
  99: { desc: 'Tormenta con granizo intenso', icon: 'storm' },
};

function getWeatherSVG(type) {
  const svgs = {
    sun: `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`,
    'cloud-sun': `<path d="M17 18a5 5 0 00-9.54-1.46A3.5 3.5 0 004 20h13a3 3 0 000-6z"/>
                   <path d="M14.34 14.16a4 4 0 00-2.68-6.1"/>
                   <line x1="20" y1="5" x2="20" y2="3"/><line x1="23" y1="8" x2="21" y2="8"/>
                   <line x1="22.24" y1="4.76" x2="20.83" y2="6.17"/>`,
    cloud: `<path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>`,
    rain: `<line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/>
           <line x1="12" y1="15" x2="12" y2="23"/>
           <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>`,
    snow: `<path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>
           <line x1="8" y1="15" x2="8" y2="15.01"/><line x1="12" y1="17" x2="12" y2="17.01"/>
           <line x1="16" y1="15" x2="16" y2="15.01"/><line x1="10" y1="19" x2="10" y2="19.01"/>
           <line x1="14" y1="19" x2="14" y2="19.01"/>`,
    storm: `<path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>
            <polyline points="13 16 11 20 15 20 13 24"/>`,
  };
  return svgs[type] || svgs.sun;
}

export const HeaderWidget = {
  _clockInterval: null,
  _weatherInterval: null,

  init() {
    this.startClock();
    this.fetchWeather();
    // Refresh weather every 30 minutes
    this._weatherInterval = setInterval(() => this.fetchWeather(), 30 * 60 * 1000);
  },

  startClock() {
    const update = () => {
      const now = new Date();
      const dateEl = document.getElementById('header-date');
      const timeEl = document.getElementById('header-time');
      if (!dateEl || !timeEl) return;

      // Date: "Mié 07 May"
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      dateEl.textContent = `${days[now.getDay()]} ${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]}`;

      // Time: "21:07:30"
      timeEl.textContent = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    };

    update();
    this._clockInterval = setInterval(update, 1000);
  },

  async fetchWeather() {
    try {
      const coords = await this.getCoords();
      const { latitude, longitude } = coords;

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather API error');

      const data = await res.json();
      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weather_code;
      const info = WMO_CODES[code] || { desc: 'Desconocido', icon: 'sun' };

      // Update DOM
      const tempEl = document.getElementById('weather-temp');
      const iconEl = document.getElementById('weather-icon');
      const weatherEl = document.getElementById('header-weather');

      if (tempEl) tempEl.textContent = `${temp}°C`;
      if (iconEl) iconEl.innerHTML = getWeatherSVG(info.icon);
      if (weatherEl) weatherEl.title = info.desc;

      // Update icon color based on weather type
      if (iconEl) {
        const colors = {
          sun: 'var(--warning)',
          'cloud-sun': 'var(--warning)',
          cloud: 'var(--text-secondary)',
          rain: 'var(--info)',
          snow: '#b3e5fc',
          storm: 'var(--danger)',
        };
        iconEl.style.color = colors[info.icon] || 'var(--warning)';
      }
    } catch (err) {
      console.warn('No se pudo obtener el clima:', err.message);
    }
  },

  getCoords() {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          () => resolve({ latitude: -34.61, longitude: -58.38 }), // Buenos Aires fallback
          { timeout: 5000 }
        );
      } else {
        resolve({ latitude: -34.61, longitude: -58.38 }); // Buenos Aires fallback
      }
    });
  },
};
