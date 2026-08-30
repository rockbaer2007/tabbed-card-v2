# Tabbed Card V2

Tabbed Card V2 is a Home Assistant Lovelace card that renders normal Home Assistant cards inside tabs.

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
