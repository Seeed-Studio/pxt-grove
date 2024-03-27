# Grove

MakeCode package for for Grove Seeed Studio modules.

## Basic usage

### Grove - Gesture

get gesture model.

```blocks


grove.onGesture(GroveGesture.Up, () => {
    basic.showString("Up");
})
grove.onGesture(GroveGesture.Down, () => {
    basic.showString("Down");
})


grove.initGesture()
basic.forever(function () {
    if (grove.getGestureModel() == 1) {
        basic.showLeds(`
            . . # . .
            . . . # .
            # # # # #
            . . . # .
            . . # . .
            `)
    }
    if (grove.getGestureModel() == 2) {
        basic.showLeds(`
            . . # . .
            . # . . .
            # # # # #
            . # . . .
            . . # . .
            `)
    }
    if (grove.getGestureModel() == 3) {
        basic.showLeds(`
            . . # . .
            . # # # .
            # . # . #
            . . # . .
            . . # . .
            `)
    }
    if (grove.getGestureModel() == 4) {
        basic.showLeds(`
            . . # . .
            . . # . .
            # . # . #
            . # # # .
            . . # . .
            `)
    }
    basic.pause(100)
})
```
all the model
```

/**
 * Grove Gestures
 */
enum GroveGesture {
    //% block=None
    None = 0,
    //% block=Right
    Right = 1,
    //% block=Left
    Left = 2,
    //% block=Up
    Up = 3,
    //% block=Down
    Down = 4,
    //% block=Forward
    Forward = 5,
    //% block=Backward
    Backward = 6,
    //% block=Clockwise
    Clockwise = 7,
    //% block=Anticlockwise
    Anticlockwise = 8,
    //% block=Wave
    Wave = 9
}
```

### Grove - Ultrasonic Ranger

Measure distance in centimeters, specify the signal pin.

```blocks
let distance = grove.measureInCentimeters(DigitalPin.P0);
```

Measure distance in inches, specify the signal pin.

```blocks
let distance = grove.measureInInches(DigitalPin.P0);
```

### Grove - Moisture sensor

Measures the soil moisture as analog values from 0 - 1023

```blocks
let moisture = grove.measureMoistureAnalog(AnalogPin.C16);
```

Measures the soil moisture as a percentage from 0 - 100

```blocks
let moisture = grove.measureMoisturePercent(AnalogPin.C16);
```

### Grove - 4 digital display

Create a 4 Digital Display driver, specify the clk and data pin, and set the brightness level, then start display value.

```blocks
let display = grove.createDisplay(DigitalPin.P0, DigitalPin.P1);
display.set(7);
display.show(1234);
```

Use ``||bit||`` to display one bit number.

Use ``||point||`` to open or close point dispay.

Use ``||clear||`` to clean display.

### Grove - UART WiFi V2

Connect to a WiFi and send data to ThinkSpeak or IFTTT, specify the UART tx and rx pin.

```blocks
grove.setupWifi(
    SerialPin.P15,
    SerialPin.P1,
    BaudRate.BaudRate115200,
    "test-ssid",
    "test-passwd"
)

basic.forever(() => {
    if (grove.wifiOK()) {
        basic.showIcon(IconNames.Yes)
    } else {
        basic.showIcon(IconNames.No)
    }
    grove.sendToThinkSpeak("write_api_key", 1, 2, 3, 4, 5, 6, 7, 8)
    grove.sendToIFTTT("ifttt_event", "ifttt_key", "hello", 'micro', 'bit')
    basic.pause(60000)
})
```

## License

MIT

## Supported targets

* for PXT/calliopemini
