import { CONFIG } from './config.js';

class AuthManager {
  constructor() {
    this.tokenClient = null;
    this.accessToken = null;
    this.expiresAt = null;
    this.onStatusChange = null;
  }

  init(callback) {
    this.onStatusChange = callback;
    
    // Check if we have a token in session storage
    const storedToken = sessionStorage.getItem('g_access_token');
    const storedExpiry = sessionStorage.getItem('g_expires_at');
    
    if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry)) {
      this.accessToken = storedToken;
      this.expiresAt = parseInt(storedExpiry);
    }

    // Load the Google Identity Services library
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.CLIENT_ID,
        scope: CONFIG.SCOPES,
        callback: (response) => {
          if (response.error !== undefined) {
            throw response;
          }
          this.accessToken = response.access_token;
          this.expiresAt = Date.now() + (response.expires_in * 1000);
          
          sessionStorage.setItem('g_access_token', this.accessToken);
          sessionStorage.setItem('g_expires_at', this.expiresAt);
          
          if (this.onStatusChange) this.onStatusChange(true);
        },
      });
      if (this.onStatusChange) this.onStatusChange(this.isAuthenticated());
    };
    document.head.appendChild(script);
  }

  login() {
    if (this.tokenClient) {
      // Prompt for consent if not already authorized or token expired
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  }

  logout() {
    google.accounts.oauth2.revoke(this.accessToken, () => {
      this.accessToken = null;
      this.expiresAt = null;
      sessionStorage.removeItem('g_access_token');
      sessionStorage.removeItem('g_expires_at');
      if (this.onStatusChange) this.onStatusChange(false);
    });
  }

  isAuthenticated() {
    return !!this.accessToken && Date.now() < this.expiresAt;
  }

  getAccessToken() {
    if (!this.isAuthenticated()) return null;
    return this.accessToken;
  }
}

export const auth = new AuthManager();
