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
      "--tabbed-card-v2-tabbar-background": "transparent",
      "--tabbed-card-v2-active-background": "transparent",
      "--tabbed-card-v2-inactive-background": "transparent",
      "--tabbed-card-v2-hover-background": "var(--secondary-background-color)",
      "--tabbed-card-v2-tab-border-radius-top": "0",
      "--tabbed-card-v2-tab-border-radius-bottom": "0",
      "--tabbed-card-v2-tabs-padding-left": "0",
      "--tabbed-card-v2-tabs-padding-top": "0",
      "--tabbed-card-v2-tabs-gap": "0",
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
          gap: var(--tabbed-card-v2-tabs-gap);
          overflow-x: auto;
          scrollbar-width: thin;
          border-bottom: 1px solid var(--divider-color);
          background: var(--tabbed-card-v2-tabbar-background);
          padding-left: var(--tabbed-card-v2-tabs-padding-left);
          padding-top: var(--tabbed-card-v2-tabs-padding-top);
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
          border-radius:
            var(--tabbed-card-v2-tab-border-radius-top)
            var(--tabbed-card-v2-tab-border-radius-top)
            var(--tabbed-card-v2-tab-border-radius-bottom)
            var(--tabbed-card-v2-tab-border-radius-bottom);
          background: var(--tabbed-card-v2-inactive-background);
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
          background: var(--tabbed-card-v2-hover-background);
          outline: none;
        }

        .tab.active {
          background: var(--tabbed-card-v2-active-background);
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
    this._config = undefined;
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

        p,
        output {
          margin: 0;
          color: var(--secondary-text-color);
          font-size: 13px;
          line-height: 1.45;
        }

        textarea {
          min-height: 360px;
          width: 100%;
          box-sizing: border-box;
          border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.35));
          border-radius: 6px;
          background: var(--code-editor-background-color, var(--card-background-color));
          color: var(--primary-text-color);
          font: 13px/1.45 ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
          padding: 12px;
          resize: vertical;
          tab-size: 2;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        button,
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

        button {
          background: var(--primary-color);
          cursor: pointer;
        }

        button.primary,
        a.primary {
          background: var(--primary-color);
          color: var(--text-primary-color);
        }

        .error {
          color: var(--error-color, #b00020);
        }
      </style>
      <div class="panel">
        <h3>Tabbed Card V2</h3>
        <p>
          YAML oder JSON direkt einfügen und übernehmen.
        </p>
        <textarea id="config-editor" spellcheck="false"></textarea>
        <div class="actions">
          <button id="apply-config" class="primary" type="button">Code übernehmen</button>
          <a href="https://github.com/rockbaer2007/tabbed-card-v2" target="_blank" rel="noreferrer">
            HACS-Card
          </a>
        </div>
        <output id="editor-status"></output>
      </div>
    `;
    const editor = this.shadowRoot.querySelector("#config-editor");
    const status = this.shadowRoot.querySelector("#editor-status");
    editor.value = stringifyYaml(this._config ?? TabbedCardV2.getStubConfig());
    this.shadowRoot.querySelector("#apply-config").addEventListener("click", () => {
      try {
        const config = parseConfigText(editor.value);
        if (!config || config.type !== "custom:tabbed-card-v2") {
          throw new Error("type muss custom:tabbed-card-v2 sein.");
        }
        if (!Array.isArray(config.tabs) || config.tabs.length === 0) {
          throw new Error("tabs muss mindestens einen Eintrag enthalten.");
        }
        this._config = config;
        status.className = "";
        status.textContent = "Konfiguration übernommen.";
        this.dispatchEvent(new CustomEvent("config-changed", {
          bubbles: true,
          composed: true,
          detail: { config },
        }));
      } catch (error) {
        status.className = "error";
        status.textContent = `Fehler: ${error.message}`;
      }
    });
  }
}

function mapKnownStyles(styles) {
  return {
    ...(styles["--mdc-theme-primary"] ? { "--tabbed-card-v2-active-color": styles["--mdc-theme-primary"] } : {}),
    ...(styles["--mdc-tab-text-label-color-default"] ? { "--tabbed-card-v2-inactive-color": styles["--mdc-tab-text-label-color-default"] } : {}),
    ...(styles["--mdc-typography-button-font-size"] ? { "--tabbed-card-v2-font-size": styles["--mdc-typography-button-font-size"] } : {}),
    ...(styles["--tabbed-card-v2-tabbar-background"] ? { "--tabbed-card-v2-tabbar-background": styles["--tabbed-card-v2-tabbar-background"] } : {}),
    ...(styles["--tabbed-card-v2-active-background"] ? { "--tabbed-card-v2-active-background": styles["--tabbed-card-v2-active-background"] } : {}),
    ...(styles["--tabbed-card-v2-inactive-background"] ? { "--tabbed-card-v2-inactive-background": styles["--tabbed-card-v2-inactive-background"] } : {}),
    ...(styles["--tabbed-card-v2-hover-background"] ? { "--tabbed-card-v2-hover-background": styles["--tabbed-card-v2-hover-background"] } : {}),
    ...(styles["--tabbed-card-v2-tab-border-radius-top"] ? { "--tabbed-card-v2-tab-border-radius-top": styles["--tabbed-card-v2-tab-border-radius-top"] } : {}),
    ...(styles["--tabbed-card-v2-tab-border-radius-bottom"] ? { "--tabbed-card-v2-tab-border-radius-bottom": styles["--tabbed-card-v2-tab-border-radius-bottom"] } : {}),
    ...(styles["--tabbed-card-v2-tabs-padding-left"] ? { "--tabbed-card-v2-tabs-padding-left": styles["--tabbed-card-v2-tabs-padding-left"] } : {}),
    ...(styles["--tabbed-card-v2-tabs-padding-top"] ? { "--tabbed-card-v2-tabs-padding-top": styles["--tabbed-card-v2-tabs-padding-top"] } : {}),
    ...(styles["--tabbed-card-v2-tabs-gap"] ? { "--tabbed-card-v2-tabs-gap": styles["--tabbed-card-v2-tabs-gap"] } : {}),
  };
}

function parseConfigText(text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) {
    throw new Error("Der Editor ist leer.");
  }
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }
  return parseSimpleYaml(trimmed);
}

function parseSimpleYaml(text) {
  const lines = text
    .replace(/\t/g, "  ")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#"));
  let index = 0;

  function countIndent(line) {
    return line.match(/^ */)[0].length;
  }

  function parseBlock(indent) {
    if (index >= lines.length) return {};
    return lines[index].slice(indent).trimStart().startsWith("- ")
      ? parseArray(indent)
      : parseObject(indent);
  }

  function parseObject(indent) {
    const object = {};
    while (index < lines.length) {
      const line = lines[index];
      const currentIndent = countIndent(line);
      if (currentIndent < indent) break;
      if (currentIndent > indent) {
        throw new Error(`Unerwartete Einrückung in Zeile ${index + 1}.`);
      }
      const content = line.slice(indent);
      if (content.startsWith("- ")) break;
      const separator = content.indexOf(":");
      if (separator < 0) {
        throw new Error(`Erwartet key: value in Zeile ${index + 1}.`);
      }
      const key = content.slice(0, separator).trim();
      const valueText = content.slice(separator + 1).trim();
      index += 1;
      object[key] = valueText
        ? parseScalar(valueText)
        : parseBlock(nextIndent(indent));
    }
    return object;
  }

  function parseArray(indent) {
    const array = [];
    while (index < lines.length) {
      const line = lines[index];
      const currentIndent = countIndent(line);
      if (currentIndent < indent) break;
      if (currentIndent !== indent || !line.slice(indent).startsWith("- ")) break;
      const content = line.slice(indent + 2).trim();
      index += 1;
      if (!content) {
        array.push(parseBlock(nextIndent(indent)));
        continue;
      }
      const separator = content.indexOf(":");
      if (separator > 0 && !content.startsWith('"') && !content.startsWith("'")) {
        const key = content.slice(0, separator).trim();
        const valueText = content.slice(separator + 1).trim();
        const item = { [key]: valueText ? parseScalar(valueText) : parseBlock(nextIndent(indent)) };
        while (index < lines.length && countIndent(lines[index]) > indent) {
          const nested = parseBlock(nextIndent(indent));
          Object.assign(item, nested);
        }
        array.push(item);
      } else {
        array.push(parseScalar(content));
      }
    }
    return array;
  }

  function nextIndent(indent) {
    if (index >= lines.length) return indent + 2;
    return Math.max(indent + 2, countIndent(lines[index]));
  }

  const result = parseBlock(0);
  if (index < lines.length) {
    throw new Error(`YAML konnte ab Zeile ${index + 1} nicht vollständig gelesen werden.`);
  }
  return result;
}

function parseScalar(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null" || value === "~") return null;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function stringifyYaml(value, indent = 0) {
  const spaces = " ".repeat(indent);
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const entries = Object.entries(item);
        if (entries.length === 0) return `${spaces}- {}`;
        const [firstKey, firstValue] = entries[0];
        const firstLine = isPlainScalar(firstValue)
          ? `${spaces}- ${firstKey}: ${formatScalar(firstValue)}`
          : `${spaces}- ${firstKey}:\n${stringifyYaml(firstValue, indent + 4)}`;
        const rest = entries.slice(1).map(([key, entryValue]) => (
          isPlainScalar(entryValue)
            ? `${spaces}  ${key}: ${formatScalar(entryValue)}`
            : `${spaces}  ${key}:\n${stringifyYaml(entryValue, indent + 4)}`
        ));
        return [firstLine, ...rest].join("\n");
      }
      return `${spaces}- ${formatScalar(item)}`;
    }).join("\n");
  }
  if (value && typeof value === "object") {
    return Object.entries(value).map(([key, entryValue]) => (
      isPlainScalar(entryValue)
        ? `${spaces}${key}: ${formatScalar(entryValue)}`
        : `${spaces}${key}:\n${stringifyYaml(entryValue, indent + 2)}`
    )).join("\n");
  }
  return `${spaces}${formatScalar(value)}`;
}

function isPlainScalar(value) {
  return value === null || typeof value !== "object";
}

function formatScalar(value) {
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  const text = String(value);
  return /^[A-Za-z0-9_./:-]+(?: [A-Za-z0-9_./:-]+)*$/.test(text)
    ? text
    : JSON.stringify(text);
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
