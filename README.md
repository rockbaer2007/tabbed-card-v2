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

For the full visual editor, install the Tabbed Card V2 app package.
