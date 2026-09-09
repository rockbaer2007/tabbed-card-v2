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

  getGridOptions() {
    const gridOptions = this._config?.grid_options ?? {};
    const columns = gridOptions.columns ?? this._config?.columns ?? "full";
    return {
      columns: columns === "full" ? "full" : clampNumber(columns, 12, 1, 12),
      min_columns: 3,
    };
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
      "--tabbed-card-v2-card-background": "var(--ha-card-background, var(--card-background-color))",
      "--tabbed-card-v2-card-border": "var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color))",
      "--tabbed-card-v2-card-border-radius": "var(--ha-card-border-radius, 12px)",
      "--tabbed-card-v2-content-padding-side": "0",
      "--tabbed-card-v2-content-padding-bottom": "0",
      "--tabbed-card-v2-tabbar-background": "transparent",
      "--tabbed-card-v2-active-background": "transparent",
      "--tabbed-card-v2-active-background-opacity": "100",
      "--tabbed-card-v2-active-background-rendered": "transparent",
      "--tabbed-card-v2-inactive-background": "transparent",
      "--tabbed-card-v2-inactive-background-opacity": "100",
      "--tabbed-card-v2-inactive-background-rendered": "transparent",
      "--tabbed-card-v2-hover-background": "var(--secondary-background-color)",
      "--tabbed-card-v2-tab-border-radius-top": "0",
      "--tabbed-card-v2-tab-border-radius-bottom": "0",
      "--tabbed-card-v2-tabs-padding-left": "0",
      "--tabbed-card-v2-tabs-padding-top": "0",
      "--tabbed-card-v2-tabs-gap": "0",
      "--tabbed-card-v2-indicator-inset": "0",
      "--tabbed-card-v2-indicator-border-radius": "0",
      "--tabbed-card-v2-font-size": "14px",
      ...mapKnownStyles(this._config.styles),
    };
    styleValues["--tabbed-card-v2-active-background-rendered"] = renderColorWithOpacity(
      styleValues["--tabbed-card-v2-active-background"],
      styleValues["--tabbed-card-v2-active-background-opacity"],
    );
    styleValues["--tabbed-card-v2-inactive-background-rendered"] = renderColorWithOpacity(
      styleValues["--tabbed-card-v2-inactive-background"],
      styleValues["--tabbed-card-v2-inactive-background-opacity"],
    );
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
          width: 100%;
          min-width: 100%;
          max-width: 100%;
          inline-size: 100%;
          flex: 1 1 100%;
          justify-self: stretch;
          align-self: stretch;
          box-sizing: border-box;
          ${Object.entries(styleValues).map(([key, value]) => `${key}: ${value};`).join("\n")}
        }

        ha-card {
          display: block;
          width: 100%;
          box-sizing: border-box;
          background: var(--tabbed-card-v2-card-background);
          border: var(--tabbed-card-v2-card-border);
          border-radius: var(--tabbed-card-v2-card-border-radius);
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
          background: var(--tabbed-card-v2-inactive-background-rendered);
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
          background: var(--tabbed-card-v2-active-background-rendered);
          color: var(--tabbed-card-v2-active-color);
        }

        .tab.active::after {
          position: absolute;
          right: var(--tabbed-card-v2-indicator-inset);
          bottom: 0;
          left: var(--tabbed-card-v2-indicator-inset);
          height: 3px;
          border-radius: var(--tabbed-card-v2-indicator-border-radius);
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
          width: 100%;
          box-sizing: border-box;
          padding-right: var(--tabbed-card-v2-content-padding-side);
          padding-bottom: var(--tabbed-card-v2-content-padding-bottom);
          padding-left: var(--tabbed-card-v2-content-padding-side);
        }

        .content > * {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
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
  const hasStyle = (key) => Object.prototype.hasOwnProperty.call(styles, key);
  return {
    ...(hasStyle("--mdc-theme-primary") ? { "--tabbed-card-v2-active-color": styles["--mdc-theme-primary"] } : {}),
    ...(hasStyle("--mdc-tab-text-label-color-default") ? { "--tabbed-card-v2-inactive-color": styles["--mdc-tab-text-label-color-default"] } : {}),
    ...(hasStyle("--mdc-typography-button-font-size") ? { "--tabbed-card-v2-font-size": styles["--mdc-typography-button-font-size"] } : {}),
    ...(hasStyle("--tabbed-card-v2-card-background") ? { "--tabbed-card-v2-card-background": styles["--tabbed-card-v2-card-background"] } : {}),
    ...(hasStyle("--tabbed-card-v2-card-border") ? { "--tabbed-card-v2-card-border": styles["--tabbed-card-v2-card-border"] } : {}),
    ...(hasStyle("--tabbed-card-v2-card-border-radius") ? { "--tabbed-card-v2-card-border-radius": styles["--tabbed-card-v2-card-border-radius"] } : {}),
    ...(hasStyle("--tabbed-card-v2-content-padding-side") ? { "--tabbed-card-v2-content-padding-side": styles["--tabbed-card-v2-content-padding-side"] } : {}),
    ...(hasStyle("--tabbed-card-v2-content-padding-bottom") ? { "--tabbed-card-v2-content-padding-bottom": styles["--tabbed-card-v2-content-padding-bottom"] } : {}),
    ...(hasStyle("--tabbed-card-v2-tabbar-background") ? { "--tabbed-card-v2-tabbar-background": styles["--tabbed-card-v2-tabbar-background"] } : {}),
    ...(hasStyle("--tabbed-card-v2-active-background") ? { "--tabbed-card-v2-active-background": styles["--tabbed-card-v2-active-background"] } : {}),
    ...(hasStyle("--tabbed-card-v2-active-background-opacity") ? { "--tabbed-card-v2-active-background-opacity": styles["--tabbed-card-v2-active-background-opacity"] } : {}),
    ...(hasStyle("--tabbed-card-v2-inactive-background") ? { "--tabbed-card-v2-inactive-background": styles["--tabbed-card-v2-inactive-background"] } : {}),
    ...(hasStyle("--tabbed-card-v2-inactive-background-opacity") ? { "--tabbed-card-v2-inactive-background-opacity": styles["--tabbed-card-v2-inactive-background-opacity"] } : {}),
    ...(hasStyle("--tabbed-card-v2-hover-background") ? { "--tabbed-card-v2-hover-background": styles["--tabbed-card-v2-hover-background"] } : {}),
    ...(hasStyle("--tabbed-card-v2-tab-border-radius-top") ? { "--tabbed-card-v2-tab-border-radius-top": styles["--tabbed-card-v2-tab-border-radius-top"] } : {}),
    ...(hasStyle("--tabbed-card-v2-tab-border-radius-bottom") ? { "--tabbed-card-v2-tab-border-radius-bottom": styles["--tabbed-card-v2-tab-border-radius-bottom"] } : {}),
    ...(hasStyle("--tabbed-card-v2-tabs-padding-left") ? { "--tabbed-card-v2-tabs-padding-left": styles["--tabbed-card-v2-tabs-padding-left"] } : {}),
    ...(hasStyle("--tabbed-card-v2-tabs-padding-top") ? { "--tabbed-card-v2-tabs-padding-top": styles["--tabbed-card-v2-tabs-padding-top"] } : {}),
    ...(hasStyle("--tabbed-card-v2-tabs-gap") ? { "--tabbed-card-v2-tabs-gap": styles["--tabbed-card-v2-tabs-gap"] } : {}),
    ...(hasStyle("--tabbed-card-v2-indicator-inset") ? { "--tabbed-card-v2-indicator-inset": styles["--tabbed-card-v2-indicator-inset"] } : {}),
    ...(hasStyle("--tabbed-card-v2-indicator-border-radius") ? { "--tabbed-card-v2-indicator-border-radius": styles["--tabbed-card-v2-indicator-border-radius"] } : {}),
  };
}

function renderColorWithOpacity(color, opacity) {
  const value = String(color ?? "transparent").trim();
  const alpha = clampOpacity(opacity);
  if (!value || value === "transparent" || alpha <= 0) {
    return "transparent";
  }
  if (alpha >= 1) {
    return value;
  }

  const rgb = parseRgbColor(value);
  if (rgb) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${roundAlpha(alpha)})`;
  }
  return `color-mix(in srgb, ${value} ${Math.round(alpha * 100)}%, transparent)`;
}

function clampOpacity(opacity) {
  const parsed = Number.parseFloat(String(opacity ?? "100").replace(",", "."));
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(100, Math.max(0, parsed)) / 100;
}

function roundAlpha(alpha) {
  return Math.round(alpha * 1000) / 1000;
}

function parseRgbColor(color) {
  const value = color.trim().toLowerCase();
  const named = NAMED_COLORS[value];
  if (named) {
    return named;
  }

  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const raw = hex[1].length === 3
      ? hex[1].split("").map((part) => part + part).join("")
      : hex[1];
    return {
      r: Number.parseInt(raw.slice(0, 2), 16),
      g: Number.parseInt(raw.slice(2, 4), 16),
      b: Number.parseInt(raw.slice(4, 6), 16),
    };
  }

  const rgb = value.match(/^rgba?\(([^)]+)\)$/);
  if (!rgb) {
    return undefined;
  }
  const parts = rgb[1].split(",").map((part) => part.trim());
  if (parts.length < 3) {
    return undefined;
  }
  const channels = parts.slice(0, 3).map((part) => {
    if (part.endsWith("%")) {
      return Math.round((Number.parseFloat(part) / 100) * 255);
    }
    return Number.parseFloat(part);
  });
  if (channels.some((part) => !Number.isFinite(part))) {
    return undefined;
  }
  return {
    r: Math.min(255, Math.max(0, Math.round(channels[0]))),
    g: Math.min(255, Math.max(0, Math.round(channels[1]))),
    b: Math.min(255, Math.max(0, Math.round(channels[2]))),
  };
}

const NAMED_COLORS = {
  black: { r: 0, g: 0, b: 0 },
  blue: { r: 0, g: 0, b: 255 },
  cyan: { r: 0, g: 255, b: 255 },
  gray: { r: 128, g: 128, b: 128 },
  green: { r: 0, g: 128, b: 0 },
  grey: { r: 128, g: 128, b: 128 },
  lightblue: { r: 173, g: 216, b: 230 },
  lime: { r: 0, g: 255, b: 0 },
  magenta: { r: 255, g: 0, b: 255 },
  orange: { r: 255, g: 165, b: 0 },
  purple: { r: 128, g: 0, b: 128 },
  red: { r: 255, g: 0, b: 0 },
  teal: { r: 0, g: 128, b: 128 },
  white: { r: 255, g: 255, b: 255 },
  yellow: { r: 255, g: 255, b: 0 },
};

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
    .split(/\r?\n/);
  let index = 0;

  function countIndent(line) {
    return line.match(/^ */)[0].length;
  }

  function skipIgnorableLines() {
    while (index < lines.length) {
      const trimmed = lines[index].trim();
      if (trimmed && !trimmed.startsWith("#")) break;
      index += 1;
    }
  }

  function parseBlock(indent) {
    skipIgnorableLines();
    if (index >= lines.length) return {};
    return lines[index].slice(indent).trimStart().startsWith("- ")
      ? parseArray(indent)
      : parseObject(indent);
  }

  function parseObject(indent) {
    const object = {};
    while (index < lines.length) {
      skipIgnorableLines();
      if (index >= lines.length) break;
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
      object[key] = isBlockScalarHeader(valueText)
        ? parseBlockScalar(valueText, indent)
        : valueText
        ? parseScalar(valueText)
        : parseBlock(nextIndent(indent));
    }
    return object;
  }

  function parseArray(indent) {
    const array = [];
    while (index < lines.length) {
      skipIgnorableLines();
      if (index >= lines.length) break;
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
        const item = {
          [key]: isBlockScalarHeader(valueText)
            ? parseBlockScalar(valueText, indent)
            : valueText
              ? parseScalar(valueText)
              : parseBlock(nextIndent(indent)),
        };
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

  function parseBlockScalar(header, parentIndent) {
    const stripFinalNewline = header.endsWith("-");
    const scalarLines = [];
    let blockIndent = undefined;
    while (index < lines.length) {
      const line = lines[index];
      const currentIndent = countIndent(line);
      if (line.trim() && currentIndent <= parentIndent) break;
      if (line.trim() && blockIndent === undefined) {
        blockIndent = currentIndent;
      }
      scalarLines.push(blockIndent === undefined ? "" : line.slice(Math.min(blockIndent, line.length)));
      index += 1;
    }
    const value = scalarLines.join("\n");
    return stripFinalNewline ? value.replace(/\n+$/g, "") : `${value}\n`;
  }

  function nextIndent(indent) {
    skipIgnorableLines();
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
        const firstLine = isMultilineScalar(firstValue)
          ? `${spaces}- ${firstKey}: |-\n${formatBlockScalar(firstValue, indent + 4)}`
          : isPlainScalar(firstValue)
          ? `${spaces}- ${firstKey}: ${formatScalar(firstValue)}`
          : `${spaces}- ${firstKey}:\n${stringifyYaml(firstValue, indent + 4)}`;
        const rest = entries.slice(1).map(([key, entryValue]) => (
          isMultilineScalar(entryValue)
            ? `${spaces}  ${key}: |-\n${formatBlockScalar(entryValue, indent + 4)}`
            : isPlainScalar(entryValue)
            ? `${spaces}  ${key}: ${formatScalar(entryValue)}`
            : `${spaces}  ${key}:\n${stringifyYaml(entryValue, indent + 4)}`
        ));
        return [firstLine, ...rest].join("\n");
      }
      return isMultilineScalar(item)
        ? `${spaces}- |-\n${formatBlockScalar(item, indent + 2)}`
        : `${spaces}- ${formatScalar(item)}`;
    }).join("\n");
  }
  if (value && typeof value === "object") {
    return Object.entries(value).map(([key, entryValue]) => (
      isMultilineScalar(entryValue)
        ? `${spaces}${key}: |-\n${formatBlockScalar(entryValue, indent + 2)}`
        : isPlainScalar(entryValue)
        ? `${spaces}${key}: ${formatScalar(entryValue)}`
        : `${spaces}${key}:\n${stringifyYaml(entryValue, indent + 2)}`
    )).join("\n");
  }
  return isMultilineScalar(value)
    ? `${spaces}|-\n${formatBlockScalar(value, indent + 2)}`
    : `${spaces}${formatScalar(value)}`;
}

function isPlainScalar(value) {
  return value === null || typeof value !== "object";
}

function isBlockScalarHeader(value) {
  return /^[>|][+-]?$/.test(value);
}

function isMultilineScalar(value) {
  return typeof value === "string" && /[\r\n]/.test(value);
}

function formatBlockScalar(value, indent) {
  const spaces = " ".repeat(indent);
  return String(value).replace(/\r\n/g, "\n").replace(/\n+$/g, "").split("\n")
    .map((line) => `${spaces}${line}`)
    .join("\n");
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

function clampNumber(value, fallback, min, max) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.max(min, Math.min(Math.floor(numericValue), max));
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
