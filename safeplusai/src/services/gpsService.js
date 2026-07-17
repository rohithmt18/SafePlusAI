/**
 * GPS Service — Geolocation + reverse geocoding
 * Tracks user location and applies time-of-day risk factor.
 */

class GPSService {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.onUpdate = null;
    this.currentPosition = null;
    this.currentAddress = null;
    this.riskContribution = 0;
    this.accuracy = null;
  }

  async start(onUpdate) {
    if (!navigator.geolocation) return false;
    this.onUpdate = onUpdate;
    this.isTracking = true;

    // Get initial position
    try {
      const pos = await this._getCurrentPosition();
      await this._processPosition(pos);
    } catch (e) {
      // Might be denied or timeout
    }

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this._processPosition(pos),
      (err) => {
        if (this.onUpdate) this.onUpdate({ error: err.message, riskScore: 0 });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
    return true;
  }

  _getCurrentPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      });
    });
  }

  async _processPosition(pos) {
    const { latitude, longitude, accuracy } = pos.coords;
    this.currentPosition = { lat: latitude, lng: longitude };
    this.accuracy = Math.round(accuracy);

    // Time-of-day risk (5 points at night)
    const hour = new Date().getHours();
    const isNighttime = hour < 6 || hour >= 21;
    const timeRisk = isNighttime ? 5 : 0;
    this.riskContribution = timeRisk;

    // Reverse geocode
    let address = null;
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await resp.json();
      const a = data.address;
      address = [
        a.road || a.pedestrian || a.neighbourhood,
        a.suburb || a.city_district,
        a.city || a.town || a.village,
        a.country_code ? a.country_code.toUpperCase() : null,
      ].filter(Boolean).join(', ');
    } catch (e) {
      address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    }

    this.currentAddress = address;

    if (this.onUpdate) {
      this.onUpdate({
        lat: latitude,
        lng: longitude,
        accuracy: Math.round(accuracy),
        address,
        isNighttime,
        timeRisk,
        riskScore: timeRisk,
        timestamp: new Date().toISOString(),
      });
    }
  }

  stop() {
    this.isTracking = false;
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  getState() {
    return {
      isTracking: this.isTracking,
      position: this.currentPosition,
      address: this.currentAddress,
      accuracy: this.accuracy,
      riskContribution: this.riskContribution,
    };
  }
}

export default new GPSService();
