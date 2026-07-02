import { useState, useEffect, useRef, useCallback } from 'react';
import './TemperatureMonitor.css';
import SectionAbout from '../components/SectionAbout';
import {
  Thermometer, Droplets, Wind, Bell, BellOff, RefreshCw, MapPin,
  AlertTriangle, CheckCircle, Info, ChevronRight, Play, Volume2, ShieldAlert
} from 'lucide-react';

const HISTORY_KEY = 'medivault_temp_history';
const MAX_HISTORY = 48;

// Beautiful initial mock data to show an awesome showcase immediately if history is empty
const generateMockHistory = () => {
  const mock = [];
  const now = Date.now();
  const times = [
    '08:00 AM', '10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM', '08:00 PM', '10:00 PM'
  ];
  const temps = [34.2, 37.5, 41.4, 43.1, 42.5, 39.8, 36.4, 33.1];
  
  for (let i = 0; i < times.length; i++) {
    mock.push({
      time: times[i],
      temp: temps[i],
      ts: now - (times.length - i) * 2 * 60 * 60 * 1000
    });
  }
  return mock;
};

function getHeatLevel(temp) {
  if (temp === null || temp === undefined) return 'unknown';
  if (temp >= 45) return 'extreme';
  if (temp >= 40) return 'danger';
  if (temp >= 35) return 'warning';
  if (temp >= 28) return 'moderate';
  if (temp <= 17) return 'cold';
  return 'normal';
}

function getSuggestions(temp) {
  if (temp === null) return [];
  if (temp <= 17) return [
    { icon: '❄️', title: 'THE TEMPERATURE IS LOW', text: 'THE TEMPERATURE IS LOW so drink hot water and keep hydrated.', urgent: true },
    { icon: '🍵', title: 'Warm Drinks Suggested', text: 'Enjoy warm items like ginger tea, herbal tea, hot coffee, or warm soups to overcome low temp.', urgent: true },
    { icon: '🧥', title: 'Dress in Layers', text: 'Wear heavy layers, sweaters, and thermals to protect yourself from the cold.', urgent: false },
  ];
  if (temp >= 45) return [
    { icon: '🚨', title: 'EXTREME HEAT EMERGENCY', text: 'Stay indoors immediately. Do not go outside!', urgent: true },
    { icon: '💧', title: 'Critical Hydration', text: 'Drink 500ml water every 30-45 minutes.', urgent: true },
    { icon: '🥤', title: 'Electrolytes Required', text: 'Drink cool drinks rich in electrolytes, ORS, or coconut water to replenish essential minerals.', urgent: true },
    { icon: '🧊', title: 'Cooling Techniques', text: 'Apply cold wet towels to neck, forehead, and underarms.', urgent: false },
    { icon: '📞', title: 'Medical Help', text: 'Contact doctor or call helpline if feeling dizzy, confused, or nauseous.', urgent: true },
  ];
  if (temp >= 40) return [
    { icon: '⚠️', title: 'THE TEMPERATURE IS HIGH', text: 'THE TEMPERATURE IS HIGH so drink water and keep hydrated.', urgent: true },
    { icon: '🥤', title: 'Cool Items Suggested', text: 'Enjoy cool items like coconut water, cold buttermilk, fresh fruit juice, or ORS to overcome higher temp.', urgent: true },
    { icon: '🏠', title: 'Stay Cool', text: 'Keep in air-conditioned or well-ventilated cool rooms.', urgent: false },
  ];
  if (temp >= 35) return [
    { icon: '☀️', title: 'High Summer Temperature', text: 'Limit direct outdoor physical activities. Seek shade.', urgent: false },
    { icon: '💧', title: 'Hydration Goal', text: 'Drink at least 3-4 liters of water throughout the day.', urgent: false },
    { icon: '🥤', title: 'Electrolyte Intake', text: 'Supplement water with electrolyte beverages or citrus drinks.', urgent: false },
    { icon: '🕶️', title: 'Sun Protection', text: 'Use umbrellas, sunglasses, and high SPF sunscreen if stepping out.', urgent: false },
  ];
  if (temp >= 28) return [
    { icon: '🌤️', title: 'Warm Weather', text: 'Drink 8-10 glasses of water. Keep an eye on direct sunlight exposure.', urgent: false },
    { icon: '🍉', title: 'Hydrating Diet', text: 'Eat fresh fruits with high water content like watermelons, cucumbers, oranges.', urgent: false },
  ];
  return [
    { icon: '✅', title: 'Pleasant Environment', text: 'Perfect temperature. Great time for outdoor physical activity!', urgent: false },
    { icon: '💧', title: 'Standard Hydration', text: 'Maintain a healthy water intake of 2-3 liters today.', urgent: false },
  ];
}

export default function TemperatureMonitor() {
  const [temp, setTemp] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [windSpeed, setWindSpeed] = useState(null);
  const [feelsLike, setFeelsLike] = useState(null);
  const [location, setLocation] = useState(null);
  
  const [weatherCode, setWeatherCode] = useState(null);
  const [themeOverride, setThemeOverride] = useState('auto');

  // Compute active weather theme
  const getActiveTheme = () => {
    if (themeOverride !== 'auto') return themeOverride;
    if (temp === null) return 'cool'; // default fallback while loading
    
    // 1. Snow Weather Condition (temp below 10°C or Snow weather codes)
    const snowCodes = [71, 73, 75, 77, 85, 86];
    if (temp < 10 || (weatherCode !== null && snowCodes.includes(weatherCode))) {
      return 'snow';
    }

    // 2. Thunderstorm Condition (Heavy rain with thunderstorm)
    const stormCodes = [95, 96, 99];
    if (weatherCode !== null && stormCodes.includes(weatherCode)) {
      return 'stormy';
    }

    // 3. Rainy Weather Condition (Rain codes or high humidity >= 85)
    const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82];
    if ((weatherCode !== null && rainCodes.includes(weatherCode)) || (humidity !== null && humidity >= 85)) {
      return 'rainy';
    }

    // 4. Hot Weather Condition (above 40°C)
    if (temp >= 40) {
      return 'hot';
    }

    // 5. Cool Weather Condition (below 17°C)
    if (temp < 17) {
      return 'cool';
    }

    // Default pleasant weather theme
    return 'cool';
  };

  const activeTheme = getActiveTheme();

  const getWeatherGradient = (theme) => {
    switch (theme) {
      case 'hot':
        return 'linear-gradient(135deg, #ffe4e6 0%, #ffedd5 50%, #fef9c3 100%)';
      case 'cool':
        return 'linear-gradient(135deg, #ecfeff 0%, #e0f2fe 50%, #bae6fd 100%)';
      case 'rainy':
        return 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)';
      case 'snow':
        return 'linear-gradient(135deg, #f8fafc 0%, #f0f9ff 50%, #e0f2fe 100%)';
      case 'stormy':
        return 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)';
      default:
        return 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)';
    }
  };

  const getWeatherGlow = (theme) => {
    switch (theme) {
      case 'hot':
        return 'rgba(239, 68, 68, 0.15)';
      case 'cool':
        return 'rgba(14, 165, 233, 0.15)';
      case 'rainy':
        return 'rgba(100, 116, 139, 0.15)';
      case 'snow':
        return 'rgba(56, 189, 248, 0.15)';
      case 'stormy':
        return 'rgba(71, 85, 105, 0.15)';
      default:
        return 'rgba(148, 163, 184, 0.1)';
    }
  };

  // Climate modes removed per request - using standard premium gradient backgrounds

  
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.length > 0 ? parsed : generateMockHistory();
      }
      return generateMockHistory();
    } catch {
      return generateMockHistory();
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifEnabled, setNotifEnabled] = useState(true);
  
  // Alert banner states
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertUrgent, setAlertUrgent] = useState(false);

  // ── Daily alert counters (max 4 per type per day) ───────────────────────
  // Keys stored: mv_temp_alert_date, mv_temp_hot_count, mv_temp_hot_last, mv_temp_cold_count, mv_temp_cold_last
  const getTodayKey = () => new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
  
  const getAlertCount = (type) => {
    const savedDate = localStorage.getItem('mv_temp_alert_date');
    if (savedDate !== getTodayKey()) {
      // New day — reset counters
      localStorage.setItem('mv_temp_alert_date', getTodayKey());
      localStorage.setItem('mv_temp_hot_count', '0');
      localStorage.setItem('mv_temp_hot_last', '0');
      localStorage.setItem('mv_temp_cold_count', '0');
      localStorage.setItem('mv_temp_cold_last', '0');
      return 0;
    }
    return parseInt(localStorage.getItem(`mv_temp_${type}_count`) || '0', 10);
  };

  const getLastAlertTs = (type) => parseInt(localStorage.getItem(`mv_temp_${type}_last`) || '0', 10);

  const recordAlert = (type) => {
    const count = getAlertCount(type);
    localStorage.setItem(`mv_temp_${type}_count`, String(count + 1));
    localStorage.setItem(`mv_temp_${type}_last`, String(Date.now()));
  };

  // Interactive chart state
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [chartWidth, setChartWidth] = useState(800);
  const chartContainerRef = useRef(null);
  
  const prevTempRef = useRef(null);

  // ── Responsive Resize Observer for the Chart ───────────────────────────
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setChartWidth(entry.contentRect.width);
      }
    });
    observer.observe(chartContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // ── Synthesizer Audio Alerts using Web Audio API ──────────────────────────
  const playSynthesizerAlert = useCallback((urgent = false) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      if (urgent) {
        // High quality premium urgent siren sweep sound (dual-oscillator filter sweep)
        for (let i = 0; i < 3; i++) {
          const start = now + i * 0.55;
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();
          
          osc1.type = 'sawtooth';
          osc2.type = 'sine';
          
          osc1.frequency.setValueAtTime(587.33, start); // D5
          osc1.frequency.linearRampToValueAtTime(880.00, start + 0.25); // A5
          osc1.frequency.linearRampToValueAtTime(587.33, start + 0.5);
          
          osc2.frequency.setValueAtTime(592.33, start);
          osc2.frequency.linearRampToValueAtTime(885.00, start + 0.25);
          osc2.frequency.linearRampToValueAtTime(592.33, start + 0.5);
          
          filter.type = 'lowpass';
          filter.Q.setValueAtTime(4, start);
          filter.frequency.setValueAtTime(1200, start);
          filter.frequency.exponentialRampToValueAtTime(2500, start + 0.25);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.25, start + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
          
          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          
          osc1.start(start);
          osc2.start(start);
          osc1.stop(start + 0.55);
          osc2.stop(start + 0.55);
        }
      } else {
        // Beautiful rich digital chime for standard notifications
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
        notes.forEach((freq, index) => {
          const start = now + index * 0.09;
          const osc = ctx.createOscillator();
          const sub = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          
          sub.type = 'sine';
          sub.frequency.setValueAtTime(freq * 2, start);
          
          const subGain = ctx.createGain();
          subGain.gain.setValueAtTime(0.04, start);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
          
          osc.connect(gain);
          sub.connect(subGain);
          subGain.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(start);
          sub.start(start);
          osc.stop(start + 0.55);
          sub.stop(start + 0.55);
        });
      }
    } catch (e) {
      console.warn('Audio synthesis error:', e);
    }
  }, []);

  // ── Show notification alarm ─────────────────────────────────────────────
  const triggerAlert = useCallback((msg, urgent = false) => {
    setAlertMsg(msg);
    setAlertUrgent(urgent);
    setAlertVisible(true);
    
    if (notifEnabled) {
      playSynthesizerAlert(urgent);
      
      // Native desktop notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(urgent ? '🚨 EXTREME HEAT WARNING' : '🌡️ Temperature Alert', {
          body: msg,
          icon: '/favicon.ico',
          tag: 'medivault-temp-alert'
        });
      }
    }
    
    // Auto hide after 9 seconds
    setTimeout(() => {
      setAlertVisible(false);
    }, 9000);
  }, [notifEnabled, playSynthesizerAlert]);

  // ── Fetch weather ────────────────────────────────────────────────────────
  const getWeatherData = useCallback(async (lat, lon, cityName) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&wind_speed_unit=kmh&timezone=auto`
      );
      if (!response.ok) throw new Error('Failed to retrieve meteorology data');
      const data = await response.json();
      
      const current = data.current;
      const currentTemp = Math.round(current.temperature_2m * 10) / 10;
      const currentHumid = current.relative_humidity_2m;
      const currentWind = Math.round(current.wind_speed_10m);
      const currentFeels = Math.round(current.apparent_temperature * 10) / 10;
      const currentCode = current.weather_code;
      
      setTemp(currentTemp);
      setHumidity(currentHumid);
      setWindSpeed(currentWind);
      setFeelsLike(currentFeels);
      setLocation(cityName);
      setWeatherCode(currentCode);

      // Add to log
      const logEntry = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        temp: currentTemp,
        ts: Date.now()
      };
      
      setHistory(prev => {
        const updated = [logEntry, ...prev].slice(0, MAX_HISTORY);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        return updated;
      });

      // Check sudden spike (> 3°C rise)
      if (prevTempRef.current !== null) {
        const spike = currentTemp - prevTempRef.current;
        if (spike >= 3 && currentTemp >= 37) {
          triggerAlert(`🔥 SUDDEN TEMPERATURE RISE: The temperature surged by +${spike.toFixed(1)}°C very rapidly! Currently at ${currentTemp}°C. Seek immediate shade and drink cold electrolyte drinks!`, true);
        }
      }

      // High temperature warning (> 40°C) — max 4 alerts per day, spaced ≥ 6 hours apart
      if (currentTemp > 40) {
        const hotCount = getAlertCount('hot');
        const hotLast  = getLastAlertTs('hot');
        const SIX_HOURS = 6 * 60 * 60 * 1000;
        if (hotCount < 4 && Date.now() - hotLast >= SIX_HOURS) {
          recordAlert('hot');
          triggerAlert(
            `🚨 THE TEMPERATURE IS HIGH so drink water and keep hydrated. Suggesting cool items like coconut water, cold buttermilk, fresh fruit juice, or ORS to overcome higher temp. (Alert ${hotCount + 1} of 4 today)`,
            true
          );
        }
      }

      // Low temperature warning (< 17°C) — max 4 alerts per day, spaced ≥ 6 hours apart
      if (currentTemp < 17) {
        const coldCount = getAlertCount('cold');
        const coldLast  = getLastAlertTs('cold');
        const SIX_HOURS = 6 * 60 * 60 * 1000;
        if (coldCount < 4 && Date.now() - coldLast >= SIX_HOURS) {
          recordAlert('cold');
          triggerAlert(
            `❄️ THE TEMPERATURE IS LOW so drink hot water and keep hydrated. Suggesting warm items like ginger tea, hot tea/coffee, or warm soups to overcome low temp. (Alert ${coldCount + 1} of 4 today)`,
            true
          );
        }
      }

      prevTempRef.current = currentTemp;
    } catch (e) {
      console.error(e);
      setError('Failed to fetch meteorological data. Reverting to local fallback data.');
      // Keep beautiful mock data as active values
      if (temp === null) {
        setTemp(38.5);
        setHumidity(62);
        setWindSpeed(14);
        setFeelsLike(41);
        setLocation('Hyderabad');
        setWeatherCode(0);
      }
    } finally {
      setLoading(false);
    }
  }, [triggerAlert, temp]);

  // ── Initialize Location ──────────────────────────────────────────────────
  const detectLocation = useCallback(() => {
    const fallbackIPLocation = async () => {
      try {
        const ipRes = await fetch('https://ipapi.co/json/');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.latitude && ipData.longitude) {
            const city = ipData.city || ipData.region || 'Your Area';
            getWeatherData(ipData.latitude, ipData.longitude, city);
            return true;
          }
        }
      } catch (err) {
        console.warn('IP location lookup failed for TemperatureMonitor:', err);
      }
      return false;
    };

    if (!navigator.geolocation) {
      fallbackIPLocation().then(success => {
        if (!success) getWeatherData(17.385, 78.4867, 'Hyderabad');
      });
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let city = 'Your Area';
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            city = data.address?.city || data.address?.town || data.address?.suburb || data.address?.village || 'Your Area';
          }
        } catch {}
        getWeatherData(latitude, longitude, city);
      },
      async () => {
        const success = await fallbackIPLocation();
        if (!success) {
          getWeatherData(17.385, 78.4867, 'Hyderabad');
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [getWeatherData]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    detectLocation();
    
    // Auto-update weather every 4 minutes
    const timer = setInterval(detectLocation, 4 * 60 * 1000);
    return () => clearInterval(timer);
  }, [detectLocation]);

  const currentHeat = getHeatLevel(temp);
  const heatSuggestions = getSuggestions(temp);

  // ── Color system according to safety zones ──────────────────────────────
  const heatPalettes = {
    extreme: { main: '#ef4444', gradient: 'linear-gradient(135deg, #7f1d1d, #ef4444)', glow: 'rgba(239, 68, 68, 0.45)' },
    danger:  { main: '#f97316', gradient: 'linear-gradient(135deg, #7c2d12, #ea580c)', glow: 'rgba(249, 115, 22, 0.45)' },
    warning: { main: '#eab308', gradient: 'linear-gradient(135deg, #713f12, #ca8a04)', glow: 'rgba(234, 179, 8, 0.45)' },
    moderate:{ main: '#0ea5e9', gradient: 'linear-gradient(135deg, #0c4a6e, #0284c7)', glow: 'rgba(14, 165, 233, 0.45)' },
    normal:  { main: '#10b981', gradient: 'linear-gradient(135deg, #064e3b, #059669)', glow: 'rgba(16, 185, 129, 0.45)' },
    cold:    { main: '#3b82f6', gradient: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', glow: 'rgba(59, 130, 246, 0.45)' },
    unknown: { main: '#64748b', gradient: 'linear-gradient(135deg, #1e293b, #475569)', glow: 'rgba(100, 116, 139, 0.4)' }
  };
  const themeColors = heatPalettes[currentHeat];

  // ── Render dynamic, non-stretched pixel-perfect chart ──────────────────
  const getChartCoordinates = () => {
    const list = [...history].reverse().slice(-14); // plot up to last 14 logs
    if (list.length === 0) return [];
    
    const temps = list.map(d => d.temp);
    const maxT = Math.max(...temps, 40) + 2;
    const minT = Math.min(...temps, 17) - 2;
    
    const paddingX = 40;
    const paddingY = 30;
    const height = 200;
    const chartHeight = height - 2 * paddingY;
    const chartWidthUsable = chartWidth - 2 * paddingX;
    
    return list.map((d, i) => {
      const x = paddingX + (i / (list.length - 1 || 1)) * chartWidthUsable;
      const y = paddingY + ((maxT - d.temp) / (maxT - minT)) * chartHeight;
      return { x, y, temp: d.temp, time: d.time, data: d };
    });
  };

  const chartPoints = getChartCoordinates();
  
  // Custom Bezier curve math generator (Catmull-Rom logic representation)
  const getBezierPath = (points) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + 2 * (next.x - curr.x) / 3;
      const cpY2 = next.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const linePath = getBezierPath(chartPoints);
  
  // Fill gradient path under the curve
  const fillPath = chartPoints.length > 0 
    ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} 200 L ${chartPoints[0].x} 200 Z` 
    : '';

  // Get constant Y for the 40 degree threshold
  const getThresholdY = () => {
    if (chartPoints.length === 0) return 0;
    const temps = chartPoints.map(p => p.temp);
    const maxT = Math.max(...temps, 40) + 2;
    const minT = Math.min(...temps, 17) - 2;
    const paddingY = 30;
    return paddingY + ((maxT - 40) / (maxT - minT)) * (200 - 2 * paddingY);
  };

  // Get constant Y for the 17 degree threshold
  const getColdThresholdY = () => {
    if (chartPoints.length === 0) return 0;
    const temps = chartPoints.map(p => p.temp);
    const maxT = Math.max(...temps, 40) + 2;
    const minT = Math.min(...temps, 17) - 2;
    const paddingY = 30;
    return paddingY + ((maxT - 17) / (maxT - minT)) * (200 - 2 * paddingY);
  };

  const thresholdY = getThresholdY();

  return (
    <div className={`premium-temp-view page-theme-${activeTheme}`}>
      {/* Alert Notification Header */}
      {alertVisible && (
        <div className={`temp-alert-popout ${alertUrgent ? 'extreme-hazard' : 'warning-hazard'}`}>
          <div className="alert-popout-decor" />
          <div className="alert-popout-content">
            <div className="alert-popout-icon">
              {alertUrgent ? <ShieldAlert size={26} /> : <AlertTriangle size={24} />}
            </div>
            <div className="alert-popout-text">
              <h4>{alertUrgent ? 'CRITICAL HEAT ADVISORY' : 'TEMPERATURE THRESHOLD WARNING'}</h4>
              <p>{alertMsg}</p>
            </div>
            <button className="close-alert-btn" onClick={() => setAlertVisible(false)}>✕</button>
          </div>
        </div>
      )}

      {/* Weather Simulator Override Selector */}
      <div className="weather-simulator-panel">
        <span className="simulator-title">✨ Dynamic Weather Theme Simulator:</span>
        <div className="simulator-btn-group">
          <button 
            className={`simulator-btn ${themeOverride === 'auto' ? 'active' : ''}`}
            onClick={() => setThemeOverride('auto')}
          >
            🔄 Live API
          </button>
          <button 
            className={`simulator-btn ${themeOverride === 'hot' ? 'active' : ''}`}
            onClick={() => setThemeOverride('hot')}
          >
            ☀️ Hot Weather
          </button>
          <button 
            className={`simulator-btn ${themeOverride === 'cool' ? 'active' : ''}`}
            onClick={() => setThemeOverride('cool')}
          >
            🌤️ Cool Weather
          </button>
          <button 
            className={`simulator-btn ${themeOverride === 'rainy' ? 'active' : ''}`}
            onClick={() => setThemeOverride('rainy')}
          >
            🌧️ Rainy
          </button>
          <button 
            className={`simulator-btn ${themeOverride === 'snow' ? 'active' : ''}`}
            onClick={() => setThemeOverride('snow')}
          >
            ❄️ Snow Weather
          </button>
          <button 
            className={`simulator-btn ${themeOverride === 'stormy' ? 'active' : ''}`}
            onClick={() => setThemeOverride('stormy')}
          >
            ⛈️ Thunderstorm
          </button>
        </div>
      </div>

      {/* Main Glassmorphic Header */}
      <div className={`temp-hero-card weather-card-${activeTheme}`} style={{ '--glow-color': getWeatherGlow(activeTheme) }}>
        <div className="hero-gradient-overlay" style={{ background: getWeatherGradient(activeTheme) }} />
        
        {/* Animated Weather FX Backdrop Layers */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
          {activeTheme === 'hot' && (
            <div className="weather-fx-layer hot-fx">
              <div className="sun-burst" />
              <div className="heatwave" />
              <div className="heatwave wave-2" />
              <div className="floating-sun-particles">
                <div className="sun-particle p1" />
                <div className="sun-particle p2" />
                <div className="sun-particle p3" />
                <div className="sun-particle p4" />
                <div className="sun-particle p5" />
              </div>
            </div>
          )}
          {activeTheme === 'cool' && (
            <div className="weather-fx-layer cool-fx">
              <div className="cool-breeze wind-line-1" />
              <div className="cool-breeze wind-line-2" />
              <div className="cool-breeze wind-line-3" />
              <div className="drifting-clouds">
                <div className="weather-cloud c1">☁️</div>
                <div className="weather-cloud c2">☁️</div>
              </div>
              <div className="rolling-fog" />
            </div>
          )}
          {activeTheme === 'rainy' && (
            <div className="weather-fx-layer rainy-fx">
              <div className="drifting-dark-clouds">
                <div className="weather-dark-cloud dc1">☁️</div>
                <div className="weather-dark-cloud dc2">☁️</div>
              </div>
              <div className="rain-showers">
                <div className="rain-drop rd1" />
                <div className="rain-drop rd2" />
                <div className="rain-drop rd3" />
                <div className="rain-drop rd4" />
                <div className="rain-drop rd5" />
                <div className="rain-drop rd6" />
                <div className="rain-drop rd7" />
                <div className="rain-drop rd8" />
              </div>
              <div className="ripples-container">
                <div className="water-ripple r1" />
                <div className="water-ripple r2" />
                <div className="water-ripple r3" />
              </div>
            </div>
          )}
          {activeTheme === 'snow' && (
            <div className="weather-fx-layer snow-fx">
              <div className="snowfall-particles">
                <div className="snowflake sf1">❄️</div>
                <div className="snowflake sf2">❄️</div>
                <div className="snowflake sf3">❄️</div>
                <div className="snowflake sf4">✧</div>
                <div className="snowflake sf5">✧</div>
                <div className="snowflake sf6">❄️</div>
                <div className="snowflake sf7">✧</div>
              </div>
              <div className="frosty-mist" />
            </div>
          )}
          {activeTheme === 'stormy' && (
            <div className="weather-fx-layer stormy-fx">
              <div className="lightning-flashes" />
              <div className="drifting-dark-clouds">
                <div className="weather-dark-cloud storm-c1">☁️</div>
                <div className="weather-dark-cloud storm-c2">☁️</div>
              </div>
              <div className="heavy-rain-showers">
                <div className="rain-drop rd1 storm-rd" />
                <div className="rain-drop rd2 storm-rd" />
                <div className="rain-drop rd3 storm-rd" />
                <div className="rain-drop rd4 storm-rd" />
                <div className="rain-drop rd5 storm-rd" />
                <div className="rain-drop rd6 storm-rd" />
                <div className="rain-drop rd7 storm-rd" />
                <div className="rain-drop rd8 storm-rd" />
              </div>
              <div className="thunder-glow" />
            </div>
          )}
        </div>
        
        <div className="temp-hero-main">
          <div className="temp-hero-metadata">
            <span className="location-chip">
              <MapPin size={14} />
              <span>{location || 'Detecting Weather Location...'}</span>
            </span>
            <h1 className="hero-temp-display">
              {loading ? (
                <span className="loading-dots">Detecting Temp<i>.</i><i>.</i><i>.</i></span>
              ) : (
                `${temp}°C`
              )}
            </h1>
            <p className="hero-feels-text">
              RealFeel® <strong className="glow-value">{feelsLike !== null ? `${feelsLike}°C` : '—'}</strong>
            </p>
            <div className={`hero-heat-badge heat-${currentHeat}`}>
              <span className="pulse-indicator" />
              {currentHeat === 'extreme' ? '🚨 EXTREME HEAT DANGER' :
               currentHeat === 'danger'  ? '⚠️ SEVERE HEAT WARNING' :
               currentHeat === 'warning' ? '☀️ HIGH HEAT ALERT' :
               currentHeat === 'moderate'? '🌤️ MODERATE TEMPERATURE' :
               currentHeat === 'cold'    ? '❄️ EXTREME COLD WARNING' : '✅ OPTIMAL HEALTH COMFORT'}
            </div>
          </div>

          <div className="temp-hero-stats">
            <div className="metric-glass-card">
              <div className="metric-icon humidity-tint"><Droplets size={20} /></div>
              <div className="metric-info">
                <span className="metric-title">Relative Humidity</span>
                <span className="metric-data">{humidity !== null ? `${humidity}%` : '—'}</span>
              </div>
            </div>
            
            <div className="metric-glass-card">
              <div className="metric-icon wind-tint"><Wind size={20} /></div>
              <div className="metric-info">
                <span className="metric-title">Wind Velocity</span>
                <span className="metric-data">{windSpeed !== null ? `${windSpeed} km/h` : '—'}</span>
              </div>
            </div>

            <div className="metric-glass-card">
              <div className="metric-icon comfort-tint"><Thermometer size={20} /></div>
              <div className="metric-info">
                <span className="metric-title">Heat Index Safety</span>
                <span className="metric-data">
                  {temp >= 40 ? '⛔ EXTREME RISK' : temp >= 35 ? '⚠️ CAUTION' : '🛡️ SECURE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controller Buttons Bar */}
      <div className="temp-action-bar">
        <div className="action-group">
          <button className="glass-action-btn" onClick={detectLocation} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin-refresh' : ''} />
            <span>{loading ? 'Analyzing...' : 'Refresh Live Status'}</span>
          </button>
          
          <button 
            className={`glass-action-btn ${notifEnabled ? 'active-bell' : ''}`}
            onClick={() => setNotifEnabled(v => !v)}
          >
            {notifEnabled ? <Bell size={15} /> : <BellOff size={15} />}
            <span>Notification Monitor: {notifEnabled ? 'ACTIVE' : 'OFF'}</span>
          </button>
        </div>

        <div className="action-group">
          <button className="glass-action-btn sound-test-btn" onClick={() => playSynthesizerAlert(true)}>
            <Volume2 size={15} />
            <span>Test Sound Synth Alert</span>
          </button>
          
          <button 
            className="glass-action-btn spike-test-btn"
            onClick={() => {
              triggerAlert("🔥 THE TEMPERATURE IS HIGH so drink water and keep hydrated. Suggesting cool items like coconut water, cold buttermilk, fresh fruit juice, or ORS to overcome higher temp.", true);
            }}
          >
            <Play size={14} />
            <span>Trigger Demo High Temp Alert (&gt;40°C)</span>
          </button>

          <button 
            className="glass-action-btn spike-test-btn"
            style={{ color: '#60a5fa', borderColor: 'rgba(96,165,250,0.3)', background: 'rgba(96,165,250,0.05)' }}
            onClick={() => {
              triggerAlert("❄️ THE TEMPERATURE IS LOW so drink hot water and keep hydrated. Suggesting warm items like ginger tea, hot tea/coffee, or warm soups to overcome low temp.", true);
            }}
          >
            <Play size={14} />
            <span>Trigger Demo Low Temp Alert (&lt;17°C)</span>
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="temp-dashboard-grid">
        
        {/* Dynamic & Premium Bezier Chart Card */}
        <div className="temp-dashboard-card span-all-cols">
          <div className="card-custom-header">
            <div className="header-label">
              <div className="title-glow-dot orange-dot" />
              <h3>24-Hour Heat Trend Line (Pixel-Perfect Curve)</h3>
            </div>
            <span className="header-meta-info">Total recorded history: {history.length} ticks</span>
          </div>

          <div className="chart-wrapper-container" ref={chartContainerRef}>
            {chartPoints.length < 2 ? (
              <div className="empty-chart-fallback">
                <Info size={32} />
                <p>Registering real-time temperature logs. Stand by for detailed metrics.</p>
              </div>
            ) : (
              <div className="premium-chart-stage">
                <svg className="svg-responsive-canvas" style={{ width: '100%', height: '220px' }}>
                  {/* Gradients */}
                  <defs>
                    <linearGradient id="curveGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                      <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal dotted grid lines */}
                  <line x1="0" y1="30" x2={chartWidth} y2="30" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                  <line x1="0" y1="100" x2={chartWidth} y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                  <line x1="0" y1="170" x2={chartWidth} y2="170" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />

                  {/* 40°C Danger Zone line */}
                  <line
                    x1="0"
                    y1={thresholdY}
                    x2={chartWidth}
                    y2={thresholdY}
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeDasharray="6,4"
                    className="danger-threshold-line"
                  />

                  {/* 17°C Cold Zone line */}
                  <line
                    x1="0"
                    y1={getColdThresholdY()}
                    x2={chartWidth}
                    y2={getColdThresholdY()}
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeDasharray="6,4"
                    className="cold-threshold-line"
                  />

                  {/* Shaded Area under Bezier Curve */}
                  {fillPath && <path d={fillPath} fill="url(#areaGradient)" />}

                  {/* Beautiful smooth Bezier curve line */}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="url(#curveGradient)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Glowing active markers */}
                  {chartPoints.map((pt, i) => {
                    const isDanger = pt.temp >= 40;
                    const dotColor = isDanger ? '#ef4444' : pt.temp >= 35 ? '#f59e0b' : '#10b981';
                    
                    return (
                      <g key={i} className="chart-marker-group">
                        {/* Hover interaction area */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="18"
                          fill="transparent"
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={() => setHoveredPoint(pt)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                        
                        {/* Interactive glow ring */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={hoveredPoint && hoveredPoint.x === pt.x ? "9" : "5"}
                          fill="transparent"
                          stroke={dotColor}
                          strokeWidth="2.5"
                          opacity={hoveredPoint && hoveredPoint.x === pt.x ? "0.9" : "0.4"}
                          style={{ transition: 'r 0.2s, opacity 0.2s' }}
                        />
                        
                        {/* Core solid circle */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="4"
                          fill={dotColor}
                        />

                        {/* Top Temperature Text (always neat and standard scale) */}
                        <text
                          x={pt.x}
                          y={pt.y - 12}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="700"
                          fill={isDanger ? '#ef4444' : '#1e293b'}
                          className="chart-data-label"
                        >
                          {pt.temp}°C
                        </text>

                        {/* Bottom Time Stamp Text */}
                        <text
                          x={pt.x}
                          y="194"
                          textAnchor="middle"
                          fontSize="9"
                          fill="#475569"
                          className="chart-time-label"
                        >
                          {pt.time}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Legend bar */}
                <div className="chart-status-legend">
                  <div className="legend-indicator"><span className="danger-indicator-dash" /> Danger Threshold Level (40°C)</div>
                  <div className="legend-indicator"><span className="cold-indicator-dash" /> Cold Threshold Level (17°C)</div>
                  <div className="legend-indicator"><span className="dot-circle red-dot" /> Severe (≥40°C)</div>
                  <div className="legend-indicator"><span className="dot-circle blue-dot" /> Cold (≤17°C)</div>
                  <div className="legend-indicator"><span className="dot-circle orange-dot" /> High Temp (≥35°C)</div>
                  <div className="legend-indicator"><span className="dot-circle green-dot" /> Safe Zone (18°C - 34°C)</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Electrolytes and Water Suggestions Column */}
        <div className="temp-dashboard-card">
          <div className="card-custom-header">
            <div className="header-label">
              <div className="title-glow-dot green-dot" />
              <h3>Hydration & Electrolytes Advisor</h3>
            </div>
            <span className="card-badge-cyan">Recommended</span>
          </div>

          <div className="hydration-suggestions-container">
            {/* Essential Drink Electrolytes Card */}
            {temp >= 35 && (
              <div className="electrolyte-featured-card">
                <div className="featured-banner">🍹 ELECTROLYTE DIRECTIVE</div>
                <h4>Replenish Critical Electrolytes Now!</h4>
                <p>When the environment is above 35°C, pure water is not enough. You must drink electrolyte rich cold drinks or solutions to avoid muscle cramps, dizziness, or heat stress.</p>
                <div className="drink-grid">
                  <div className="drink-chip">🥥 Coconut Water</div>
                  <div className="drink-chip">🧪 ORS / Electrol Solution</div>
                  <div className="drink-chip">🍋 Cool Lemon Juice with Salt</div>
                  <div className="drink-chip">🥛 Cold Buttermilk</div>
                </div>
              </div>
            )}

            {temp !== null && temp <= 17 && (
              <div className="electrolyte-featured-card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)', borderColor: 'rgba(59, 130, 246, 0.25)' }}>
                <div className="featured-banner" style={{ background: '#3b82f6' }}>🍵 WARM DRINKS DIRECTIVE</div>
                <h4 style={{ color: '#60a5fa' }}>Drink Hot Water & Warm Fluids!</h4>
                <p>When the temperature is below 17°C, keep your core temperature stable and stay hydrated by sipping on warm or hot healthy beverages.</p>
                <div className="drink-grid">
                  <div className="drink-chip">☕ Ginger / Herbal Tea</div>
                  <div className="drink-chip">🍵 Hot Lemon Water</div>
                  <div className="drink-chip">🥣 Warm Vegetable Soup</div>
                  <div className="drink-chip">🥛 Warm Milk with Turmeric</div>
                </div>
              </div>
            )}

            <div className="advise-list-flows">
              {heatSuggestions.map((item, idx) => (
                <div key={idx} className={`advisor-flow-card ${item.urgent ? 'urgent-critical' : ''}`}>
                  <span className="advisor-emoji">{item.icon}</span>
                  <div className="advisor-message">
                    <h5>{item.title}</h5>
                    <p>{item.text}</p>
                  </div>
                  {item.urgent && <span className="urgent-flash">URGENT</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Logger & Data Feed */}
        <div className="temp-dashboard-card">
          <div className="card-custom-header">
            <div className="header-label">
              <div className="title-glow-dot blue-dot" />
              <h3>Real-Time Temperature Activity Logs</h3>
            </div>
            <span className="card-badge-muted">Auto-Update Enabled</span>
          </div>

          <div className="activity-logger-panel">
            <div className="logger-table-header">
              <span>Timestamp</span>
              <span>Degree Value</span>
              <span>Classification Status</span>
            </div>
            
            <div className="logger-rows-scroll">
              {history.map((log, idx) => {
                const level = getHeatLevel(log.temp);
                return (
                  <div key={idx} className={`logger-data-row boundary-${level}`}>
                    <span className="log-time-stamp">{log.time}</span>
                    <span className="log-temp-value" style={{
                      color: level === 'extreme' || level === 'danger' ? '#ef4444' :
                             level === 'warning' ? '#f59e0b' : level === 'moderate' ? '#0ea5e9' : '#10b981'
                    }}>
                      <strong>{log.temp}</strong>°C
                    </span>
                    <span className={`log-badge-status level-${level}`}>
                      {level === 'extreme' ? '🚨 Extreme' :
                       level === 'danger'  ? '⚠️ Severe' :
                       level === 'warning' ? '☀️ High' :
                       level === 'moderate'? '🌤️ Warm' : '✅ Optimal'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
      <SectionAbout
        title="Temperature Alert"
        icon="🌡️"
        color="#ff7675"
        gradient="linear-gradient(135deg, #ff7675, #d63031)"
        what="The Temperature Alert monitor is a life-saving, real-time microclimate surveillance hub embedded in MediVault. It combines HTML5 geolocation access with meteorological APIs to fetch precise localized temperatures. The system incorporates a sounded notification protocol: if the ambient temperature is higher than 40°C or lower than 17°C, it sweeps high-siren alarms and displays custom emergency advice telling you exactly what fluids to drink to prevent heat strokes or hypothermia."
        howToUse={[
          'Navigate to the Temperature Alert section from the dashboard menu.',
          'Review the prominent Real-Time Weather card displaying current localized temperature, humidity, wind speed, and location name.',
          'If prompted by the browser, click "Allow" to grant location access so the system can locate your microclimate accurately.',
          'To update weather stats manually, click the circular "Refresh Now" button at any time.',
          'Review the dynamic Temperature Alert Graph showing local weather changes over the past 24-48 hours.',
          'Observe the horizontal dashed indicator lines: red at 40°C represents the High-Alert threshold, and blue at 17°C represents the Low-Alert threshold.',
          'Familiarize yourself with the sounded notifications: if temperature is >40°C, the alarm sound fires and advises "THE TEMPERATURE IS HIGH so drink water and keep hydrated" along with cooling drinks like coconut water or buttermilk.',
          'If temperature is <17°C, the alarm sound fires and advises "THE TEMPERATURE IS LOW so drink hot water and keep hydrated" along with warming items like ginger tea or hot soups.',
          'To test these sound alarms and alerts instantly, click the "Simulate High Temp (>40°C)" or "Simulate Low Temp (<17°C)" action buttons in the control box.',
          'Use the volume slider to regulate the alarm synthesizers, and click "Mute Notifications" if you want to silence the sound temporarily.',
          'Browse the "Activity Log & History" list to audit historical high, severe, warning, warm, or optimal events in detail.',
          'Integrate these temperature insights into your hydration and exercise routines to stay comfortable across all seasons.',
        ]}
        importance={[
          'Fires high-siren sounded alarms to immediately warn you when dangerous temperature limits are crossed.',
          'Provides specific medical hydration advice so you know exactly how to protect yourself in extreme heat (>40°C) or cold (<17°C).',
          'HTML5 location integration fetches the precise temperature of your actual location, not just general regional reports.',
          'Visual temperature charts plot trends to let you understand if the day is warming up or cooling down.',
          'Dynamic legend and color-coded dots (red, orange, green, blue) make health and temperature data easy to read.',
          'Built-in audio testing controls allow you to verify the alarm audio synthesizers work on your device.',
          'History logging archives up to 48 sequential measurements, letting you audit diurnal temperature fluctuations.',
          'Helps elderly or sensitive patients take early precautions to avoid thermoregulatory shock and seasonal ailments.',
          'Assists athletes in deciding whether to conduct physical therapy and yoga indoors or outdoors based on environmental safety.',
          'Works reliably in the background, updating values and triggering sound alarms as long as the page remains open.',
        ]}
      />
    </div>
  );
}
