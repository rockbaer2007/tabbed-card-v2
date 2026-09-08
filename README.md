# Tabbed Card V2

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-orange.svg?style=for-the-badge)](https://github.com/hacs/integration)

[![Open your Home Assistant instance and add this repository to HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=rockbaer2007&repository=tabbed-card-v2&category=plugin)

Tabbed Card V2 is a Home Assistant Lovelace card that renders normal Home Assistant cards inside tabs.

## Original project

Tabbed Card V2 is inspired by the original [kinghat/tabbed-card](https://github.com/kinghat/tabbed-card) project. It uses a distinct custom card name (`custom:tabbed-card-v2`) and is developed as a separate implementation with its own editor-app direction. Please also check and credit the original project when comparing features or migration behavior.

## HACS

Add this repository as a HACS custom repository with category `Dashboard`.

After installation, add the Lovelace resource:

```yaml
url: /hacsfiles/tabbed-card-v2/tabbed-card-v2.js
type: module
```

## Example

```yaml
type: custom:tabbed-card-v2
options:
  defaultTabIndex: 0
tabs:
  - attributes:
      label: Light
      icon: mdi:lightbulb
    card:
      type: button
      entity: light.bed_light
      tap_action:
        action: toggle
  - attributes:
      label: Sensors
      icon: mdi:thermometer
    card:
      type: entities
      title: Room climate
      entities:
        - sensor.living_room_temperature
        - sensor.living_room_humidity
```

## Styling

Tabbed Card V2 keeps the original Material tab variables and adds optional
background controls for the tab bar and tabs:

| Name | Default | Description |
| --- | --- | --- |
| `--mdc-theme-primary` | `--primary-color` | Active tab text and indicator color. |
| `--mdc-tab-text-label-color-default` | `--secondary-text-color` | Inactive tab text color. Use `rgba(...)` when transparency is needed. |
| `--mdc-typography-button-font-size` | `14px` | Tab label font size. |
| `--tabbed-card-v2-tabbar-background` | `transparent` | Background behind the tab row. |
| `--tabbed-card-v2-active-background` | `transparent` | Background of the active tab. |
| `--tabbed-card-v2-active-background-opacity` | `100` | Active tab background opacity from `0` to `100`. |
| `--tabbed-card-v2-inactive-background` | `transparent` | Background of inactive tabs. |
| `--tabbed-card-v2-inactive-background-opacity` | `100` | Inactive tab background opacity from `0` to `100`. |
| `--tabbed-card-v2-hover-background` | `--secondary-background-color` | Background while hovering or focusing a tab. |
| `--tabbed-card-v2-tab-border-radius-top` | `0` | Top-left and top-right radius for each tab. |
| `--tabbed-card-v2-tab-border-radius-bottom` | `0` | Bottom-left and bottom-right radius for each tab. |
| `--tabbed-card-v2-tabs-padding-left` | `0` | Space before the first tab. |
| `--tabbed-card-v2-tabs-padding-top` | `0` | Space above the tab row. |
| `--tabbed-card-v2-tabs-gap` | `0` | Space between tabs. |
| `--tabbed-card-v2-indicator-inset` | `0` | Horizontal inset for the active tab indicator. |
| `--tabbed-card-v2-indicator-border-radius` | `0` | Border radius for the active tab indicator. |

Example:

```yaml
type: custom:tabbed-card-v2
styles:
  --mdc-theme-primary: "#ff9800"
  --mdc-tab-text-label-color-default: "rgba(255,255,255,0.75)"
  --tabbed-card-v2-tabbar-background: "rgba(0,0,0,0.18)"
  --tabbed-card-v2-active-background: "#ff9800"
  --tabbed-card-v2-active-background-opacity: 35
  --tabbed-card-v2-inactive-background: "#ffffff"
  --tabbed-card-v2-inactive-background-opacity: 8
  --tabbed-card-v2-hover-background: "rgba(255,255,255,0.12)"
  --tabbed-card-v2-tab-border-radius-top: "12px"
  --tabbed-card-v2-tab-border-radius-bottom: "6px"
  --tabbed-card-v2-tabs-padding-left: "8px"
  --tabbed-card-v2-tabs-padding-top: "8px"
  --tabbed-card-v2-tabs-gap: "6px"
  --tabbed-card-v2-indicator-inset: "10px"
  --tabbed-card-v2-indicator-border-radius: "999px"
tabs:
  - attributes:
      label: Light
    card:
      type: button
      entity: light.bed_light
```
