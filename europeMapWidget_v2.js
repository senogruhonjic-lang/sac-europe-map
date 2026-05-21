(function () {
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
      .map-container svg path.active {
        fill: #3B82F6;
        stroke: #1D4ED8;
        stroke-width: 1.5;
        filter: drop-shadow(0 0 8px rgba(59,130,246,0.6));
      }
      .map-container svg path.active:hover {
        fill: #2563EB;
      }
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
      .map-tooltip.visible { opacity: 1; }
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

  class EuropeMapWidget extends HTMLElement {
    constructor() {
      super();
      this._shadowRoot = this.attachShadow({ mode: "open" });
      this._shadowRoot.appendChild(template.content.cloneNode(true));
      this._svgHost = this._shadowRoot.getElementById("svgHost");
      this._tooltip = this._shadowRoot.getElementById("tooltip");
      this._tooltipTitle = this._shadowRoot.getElementById("tooltipTitle");
      this._tooltipHint = this._shadowRoot.getElementById("tooltipHint");
      this._selectedCountry = "";
      this._clickableList = ["AT"];
      this._highlightList = ["AT"];
      this._countryNames = {
        "AT":"Oesterreich","DE":"Deutschland","CH":"Schweiz",
        "FR":"Frankreich","IT":"Italien","ES":"Spanien",
        "PL":"Polen","CZ":"Tschechien","SK":"Slowakei",
        "HU":"Ungarn","SI":"Slowenien","HR":"Kroatien",
        "NL":"Niederlande","BE":"Belgien","LU":"Luxemburg",
        "DK":"Daenemark","SE":"Schweden","NO":"Norwegen",
        "FI":"Finnland","GB":"Grossbritannien","IE":"Irland",
        "PT":"Portugal","RO":"Rumaenien","BG":"Bulgarien",
        "GR":"Griechenland","RS":"Serbien","BA":"Bosnien",
        "ME":"Montenegro","MK":"Nordmazedonien","AL":"Albanien",
        "UA":"Ukraine","BY":"Belarus","MD":"Moldau",
        "EE":"Estland","LV":"Lettland","LT":"Litauen"
      };
    }

    getSelectedCountry() {
      return this._selectedCountry;
    }

    loadMap(svgStringOrUrl) {
      var self = this;
      var trimmed = svgStringOrUrl.trim();
      if (trimmed.indexOf("<svg") === 0 || trimmed.indexOf("<?xml") === 0) {
        self._svgHost.innerHTML = trimmed;
        self._bindEvents();
      } else {
        fetch(trimmed)
          .then(function(response) { return response.text(); })
          .then(function(svgText) {
            self._svgHost.innerHTML = svgText;
            self._bindEvents();
          })
          .catch(function(err) {
            self._svgHost.innerHTML = '<p style="color:red;padding:20px;">Fehler beim Laden: ' + err.message + '</p>';
          });
      }
    }

    setActiveCountries(countryCodes) {
      this._clickableList = countryCodes.split(",").map(function(s) { return s.trim(); });
      this._highlightList = this._clickableList.slice();
      this._applyHighlights();
    }

    set svgContent(value) { if (value) { this.loadMap(value); } }
    get svgContent() { return this._svgHost.innerHTML; }
    set clickableCountries(value) { if (value) { this._clickableList = value.split(",").map(function(s) { return s.trim(); }); } }
    get clickableCountries() { return this._clickableList.join(","); }
    set highlightCountries(value) { if (value) { this._highlightList = value.split(",").map(function(s) { return s.trim(); }); this._applyHighlights(); } }
    get highlightCountries() { return this._highlightList.join(","); }
    set selectedCountry(value) { this._selectedCountry = value || ""; }
    get selectedCountry() { return this._selectedCountry; }

    _applyHighlights() {
      var self = this;
      this._svgHost.querySelectorAll("path").forEach(function(path) {
        var id = path.getAttribute("data-id") || path.getAttribute("id") || "";
        path.classList.toggle("active", self._highlightList.indexOf(id) >= 0);
      });
    }

    _bindEvents() {
      var self = this;
      this._svgHost.querySelectorAll("path").forEach(function(path) {
        var id = path.getAttribute("data-id") || path.getAttribute("id") || "";
        var name = path.getAttribute("data-name") || self._countryNames[id] || id;
        if (self._highlightList.indexOf(id) >= 0) path.classList.add("active");

        path.addEventListener("mouseenter", function() {
          self._tooltipTitle.textContent = self._countryNames[id] || name;
          self._tooltipHint.textContent = self._clickableList.indexOf(id) >= 0 ? "Klicken fuer Berichte" : "Noch nicht verfuegbar";
          self._tooltip.classList.add("visible");
        });
        path.addEventListener("mousemove", function(e) {
          var rect = self._svgHost.getBoundingClientRect();
          self._tooltip.style.left = (e.clientX - rect.left + 12) + "px";
          self._tooltip.style.top = (e.clientY - rect.top - 10) + "px";
        });
        path.addEventListener("mouseleave", function() { self._tooltip.classList.remove("visible"); });
        path.addEventListener("click", function() {
          if (self._clickableList.indexOf(id) >= 0) {
            self._selectedCountry = id;
            self.dispatchEvent(new CustomEvent("onCountryClick", {
              detail: { countryCode: id, countryName: self._countryNames[id] || name }
            }));
          }
        });
      });
    }
  }

  customElements.define("europe-map-widget", EuropeMapWidget);
})();
