// ============================================================
// SAC Custom Widget: Europe Map Landing Page
// Datei 1 von 2: Web Component (europeMapWidget.js)
// ============================================================

(function () {
  // ---- Template ----
  const template = document.createElement("template");
  template.innerHTML = `
    <style>
      :host {
        display: block;
        width: 100%;
        height: 100%;
        font-family: '72', '72full', Arial, Helvetica, sans-serif;
      }
      .map-container {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
      }
      .map-container svg {
        width: 100%;
        height: 100%;
      }

      /* ---- Länder-Styling ---- */
      .map-container svg path {
        fill: #D1D5DB;
        stroke: #FFFFFF;
        stroke-width: 0.5;
        cursor: pointer;
        transition: fill 0.3s ease, filter 0.3s ease;
      }
      .map-container svg path:hover {
        fill: #93C5FD;
        filter: drop-shadow(0 0 4px rgba(59,130,246,0.5));
      }

      /* Aktives / hervorgehobenes Land */
      .map-container svg path.active {
        fill: #3B82F6;
        stroke: #1D4ED8;
        stroke-width: 1.5;
        filter: drop-shadow(0 0 8px rgba(59,130,246,0.6));
      }
      .map-container svg path.active:hover {
        fill: #2563EB;
      }

      /* ---- Tooltip ---- */
      .map-tooltip {
        position: absolute;
        background: #1E293B;
        color: #F8FAFC;
        padding: 8px 14px;
        border-radius: 8px;
        font-size: 13px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
        z-index: 100;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        white-space: nowrap;
      }
      .map-tooltip.visible {
        opacity: 1;
      }
      .map-tooltip .hint {
        font-size: 11px;
        color: #93C5FD;
        margin-top: 2px;
      }
    </style>

    <div class="map-container">
      <div id="svgHost"></div>
      <div class="map-tooltip" id="tooltip">
        <div id="tooltipTitle"></div>
        <div class="hint" id="tooltipHint"></div>
      </div>
    </div>
  `;

  // ---- Web Component Klasse ----
  class EuropeMapWidget extends HTMLElement {

    constructor() {
      super();
      this._shadowRoot = this.attachShadow({ mode: "open" });
      this._shadowRoot.appendChild(template.content.cloneNode(true));

      // Referenzen
      this._svgHost = this._shadowRoot.getElementById("svgHost");
      this._tooltip = this._shadowRoot.getElementById("tooltip");
      this._tooltipTitle = this._shadowRoot.getElementById("tooltipTitle");
      this._tooltipHint = this._shadowRoot.getElementById("tooltipHint");

      // Konfiguration: Welche Länder klickbar sind
      this._clickableCountries = ["AT"]; // Standard: nur Österreich
      this._highlightCountries = ["AT"]; // Hervorgehobene Länder

      // Ländernamen (DE)
      this._countryNames = {
        "AT": "Österreich",
        "DE": "Deutschland",
        "CH": "Schweiz",
        "FR": "Frankreich",
        "IT": "Italien",
        "ES": "Spanien",
        "PL": "Polen",
        "CZ": "Tschechien",
        "SK": "Slowakei",
        "HU": "Ungarn",
        "SI": "Slowenien",
        "HR": "Kroatien",
        "NL": "Niederlande",
        "BE": "Belgien",
        "LU": "Luxemburg",
        "DK": "Dänemark",
        "SE": "Schweden",
        "NO": "Norwegen",
        "FI": "Finnland",
        "GB": "Großbritannien",
        "IE": "Irland",
        "PT": "Portugal",
        "RO": "Rumänien",
        "BG": "Bulgarien",
        "GR": "Griechenland",
        "RS": "Serbien",
        "BA": "Bosnien-Herzegowina",
        "ME": "Montenegro",
        "MK": "Nordmazedonien",
        "AL": "Albanien",
        "UA": "Ukraine",
        "BY": "Belarus",
        "MD": "Moldau",
        "EE": "Estland",
        "LV": "Lettland",
        "LT": "Litauen"
      };
    }

    // ---- Lifecycle ----
    connectedCallback() {
      // SVG wird über die Property gesetzt (siehe Metadata)
    }

    // ---- SVG laden und Event-Listener setzen ----
    _loadSVG(svgContent) {
      this._svgHost.innerHTML = svgContent;
      const svg = this._svgHost.querySelector("svg");
      if (!svg) return;

      // Alle Path-Elemente durchgehen
      const paths = svg.querySelectorAll("path");
      paths.forEach((path) => {
        // ID = ISO-Code (z.B. "AT", "DE")
        const id = path.getAttribute("data-id") || path.getAttribute("id") || "";
        const name = path.getAttribute("data-name") || this._countryNames[id] || id;

        // Hervorgehobene Länder markieren
        if (this._highlightCountries.includes(id)) {
          path.classList.add("active");
        }

        // ---- Hover: Tooltip ----
        path.addEventListener("mouseenter", (e) => {
          const isClickable = this._clickableCountries.includes(id);
          this._tooltipTitle.textContent = this._countryNames[id] || name;
          this._tooltipHint.textContent = isClickable
            ? "▶ Klicken für Berichte"
            : "Noch nicht verfügbar";
          this._tooltip.classList.add("visible");
        });

        path.addEventListener("mousemove", (e) => {
          const rect = this._svgHost.getBoundingClientRect();
          this._tooltip.style.left = (e.clientX - rect.left + 12) + "px";
          this._tooltip.style.top = (e.clientY - rect.top - 10) + "px";
        });

        path.addEventListener("mouseleave", () => {
          this._tooltip.classList.remove("visible");
        });

        // ---- Click: Event an SAC senden ----
        path.addEventListener("click", () => {
          if (this._clickableCountries.includes(id)) {
            // Custom Event dispatchen → SAC Script fängt das ab
            this.dispatchEvent(new CustomEvent("onCountryClick", {
              detail: {
                countryCode: id,
                countryName: this._countryNames[id] || name
              }
            }));
          }
        });
      });
    }

    // ---- Properties (von SAC aus setzbar) ----

    // SVG-Inhalt setzen
    set svgContent(value) {
      if (value) {
        this._loadSVG(value);
      }
    }

    // Klickbare Länder setzen (z.B. ["AT", "DE", "CH"])
    set clickableCountries(value) {
      if (Array.isArray(value)) {
        this._clickableCountries = value;
      }
    }

    // Hervorgehobene Länder setzen
    set highlightCountries(value) {
      if (Array.isArray(value)) {
        this._highlightCountries = value;
        // Aktualisieren
        const paths = this._svgHost.querySelectorAll("path");
        paths.forEach((path) => {
          const id = path.getAttribute("data-id") || path.getAttribute("id") || "";
          if (this._highlightCountries.includes(id)) {
            path.classList.add("active");
          } else {
            path.classList.remove("active");
          }
        });
      }
    }
  }

  // ---- Custom Element registrieren ----
  customElements.define("europe-map-widget", EuropeMapWidget);
})();
