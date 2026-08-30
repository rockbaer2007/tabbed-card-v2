class TabbedCardV2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = undefined;
    this._hass = undefined;
    this._helpers = undefined;
    this._cards = [];
    this._selectedTabIndex = 0;
  }

  static async getConfigElement() {
    return document.createElement("tabbed-card-v2-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:tabbed-card-v2",
      options: {
        defaultTabIndex: 0,
      },
      tabs: [
        {
          attributes: {
            label: "Sun",
            icon: "mdi:white-balance-sunny",
          },
          card: {
            type: "entity",
            entity: "sun.sun",
          },
        },
      ],
    };
  }

  set hass(hass) {
    this._hass = hass;
    for (const card of this._cards) {
      card.hass = hass;
    }
  }

  setConfig(config) {
    if (!config || config.type !== "custom:tabbed-card-v2") {
      throw new Error("Tabbed Card V2 requires type: custom:tabbed-card-v2");
    }
    if (!Array.isArray(config.tabs) || config.tabs.length === 0) {
      throw new Error("Tabbed Card V2 requires at least one tab.");
    }

    this._config = {
      ...config,
      options: config.options ?? {},
      styles: config.styles ?? {},
      attributes: config.attributes ?? {},
      tabs: config.tabs.map((tab) => ({
        ...tab,
        attributes: {
          ...(config.attributes ?? {}),
          ...(tab.attributes ?? {}),
        },
        styles: tab.styles ?? {},
        card: tab.card ?? { type: "entity", entity: "sun.sun" },
      })),
    };
    this._selectedTabIndex = clampIndex(
      this._config.options.defaultTabIndex ?? 0,
      this._config.tabs.length,
    );
    void this._buildCards();
  }

  getCardSize() {
    const activeCard = this._cards[this._selectedTabIndex];
    if (activeCard?.getCardSize) {
      return activeCard.getCardSize() + 1;
    }
    return 3;
  }

  async _buildCards() {
    this._helpers = this._helpers ?? await this._loadCardHelpers();
    this._cards = await Promise.all(
      this._config.tabs.map(async (tab) => {
        const card = await this._helpers.createCardElement(tab.card);
        if (this._hass) {
          card.hass = this._hass;
        }
        card.addEventListener("ll-rebuild", (event) => {
          event.stopPropagation();
          void this._buildCards();
        }, { once: true });
        return card;
      }),
    );
    this._render();
  }

  async _loadCardHelpers() {
    if (window.loadCardHelpers) {
      return window.loadCardHelpers();
    }
    throw new Error("Home Assistant card helpers are not available.");
  }

  _render() {
    if (!this._config || !this._cards.length) {
      return;
    }

    const styleValues = {
      "--tabbed-card-v2-active-color": "var(--primary-color)",
      "--tabbed-card-v2-inactive-color": "var(--secondary-text-color)",
      "--tabbed-card-v2-font-size": "14px",
      ...mapKnownStyles(this._config.styles),
    };
    const tabButtons = this._config.tabs.map((tab, index) => {
      const attributes = tab.attributes ?? {};
      const active = index === this._selectedTabIndex;
      const classes = [
        "tab",
        active ? "active" : "",
        attributes.stacked ? "stacked" : "",
        attributes.minWidth ? "min-width" : "",
        attributes.isFadingIndicator ? "fade-indicator" : "",
        attributes.isMinWidthIndicator ? "min-indicator" : "",
      ].filter(Boolean).join(" ");

      return `
        <button
          class="${classes}"
          type="button"
          data-tab-index="${index}"
          aria-selected="${String(active)}"
          role="tab"
        >
          ${attributes.icon ? `<ha-icon icon="${escapeHtml(attributes.icon)}"></ha-icon>` : ""}
          ${attributes.label ? `<span>${escapeHtml(attributes.label)}</span>` : ""}
        </button>
      `;
    }).join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          ${Object.entries(styleValues).map(([key, value]) => `${key}: ${value};`).join("\n")}
        }

        ha-card {
          display: block;
          overflow: hidden;
        }

        .tabs {
          display: flex;
          overflow-x: auto;
          scrollbar-width: thin;
          border-bottom: 1px solid var(--divider-color);
        }

        .tab {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-width: 90px;
          min-height: 48px;
          border: 0;
          border-radius: 0;
          background: transparent;
          color: var(--tabbed-card-v2-inactive-color);
          cursor: pointer;
          font: inherit;
          font-size: var(--tabbed-card-v2-font-size);
          font-weight: 500;
          padding: 8px 16px;
          white-space: nowrap;
        }

        .tab:hover,
        .tab:focus-visible {
          background: var(--secondary-background-color);
          outline: none;
        }

        .tab.active {
          color: var(--tabbed-card-v2-active-color);
        }

        .tab.active::after {
          position: absolute;
          right: 0;
          bottom: 0;
          left: 0;
          height: 3px;
          background: var(--tabbed-card-v2-active-color);
          content: "";
        }

        .tab.min-indicator.active::after {
          right: 22px;
          left: 22px;
        }

        .tab.fade-indicator.active::after {
          transition: opacity 160ms ease;
        }

        .tab.min-width {
          min-width: 54px;
          padding-inline: 12px;
        }

        .tab.stacked {
          display: grid;
          gap: 3px;
          min-height: 64px;
        }

        .content {
          display: block;
        }
      </style>
      <ha-card>
        <div class="tabs" role="tablist">${tabButtons}</div>
        <div class="content"></div>
      </ha-card>
    `;

    const content = this.shadowRoot.querySelector(".content");
    const activeCard = this._cards[this._selectedTabIndex];
    if (activeCard) {
      content.append(activeCard);
    }

    for (const button of this.shadowRoot.querySelectorAll("[data-tab-index]")) {
      button.addEventListener("click", () => {
        this._selectedTabIndex = Number(button.dataset.tabIndex);
        this._render();
      });
    }
  }
}

class TabbedCardV2Editor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    this._config = config;
    this._render();
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .panel {
          display: grid;
          gap: 12px;
          margin: 8px 0;
          padding: 14px;
          border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.25));
          border-radius: 8px;
          background: var(--card-background-color);
        }

        h3 {
          margin: 0;
          color: var(--primary-text-color);
          font-size: 15px;
          font-weight: 700;
        }

        p {
          margin: 0;
          color: var(--secondary-text-color);
          font-size: 13px;
          line-height: 1.45;
        }

        .links {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 36px;
          border: 1px solid var(--primary-color);
          border-radius: 6px;
          color: var(--primary-color);
          font-size: 13px;
          font-weight: 700;
          padding: 0 12px;
          text-decoration: none;
        }

        a.primary {
          background: var(--primary-color);
          color: var(--text-primary-color);
        }
      </style>
      <div class="panel">
        <h3>Tabbed Card V2</h3>
        <p>
          Diese Karte wird ueber die Tabbed Card V2 Editor-App eingerichtet.
          Der kleine Home-Assistant-Dialog bleibt bewusst schlank; komplexe Tabs,
          Unterkarten und HACS-Abhaengigkeiten bearbeitest du im separaten Editor.
        </p>
        <div class="links">
          <a class="primary" href="https://rockbaer2007.github.io/tabbed-card-v2-editor/" target="_blank" rel="noreferrer">
            Editor-App oeffnen
          </a>
          <a href="https://github.com/rockbaer2007/tabbed-card-v2" target="_blank" rel="noreferrer">
            HACS-Card
          </a>
        </div>
        <p>
          Installiere nur diese Card ueber HACS. Erstelle die YAML in der Editor-App
          und fuege sie hier ueber "Code-Editor anzeigen" ein.
        </p>
      </div>
    `;
  }
}

function mapKnownStyles(styles) {
  return {
    ...(styles["--mdc-theme-primary"] ? { "--tabbed-card-v2-active-color": styles["--mdc-theme-primary"] } : {}),
    ...(styles["--mdc-tab-text-label-color-default"] ? { "--tabbed-card-v2-inactive-color": styles["--mdc-tab-text-label-color-default"] } : {}),
    ...(styles["--mdc-typography-button-font-size"] ? { "--tabbed-card-v2-font-size": styles["--mdc-typography-button-font-size"] } : {}),
  };
}

function clampIndex(value, length) {
  return Math.max(0, Math.min(Number(value) || 0, Math.max(0, length - 1)));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

customElements.define("tabbed-card-v2", TabbedCardV2);
customElements.define("tabbed-card-v2-editor", TabbedCardV2Editor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "tabbed-card-v2",
  name: "Tabbed Card V2",
  description: "A tabbed Home Assistant card with a standalone visual editor.",
});
