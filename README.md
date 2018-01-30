# Grove

A Microsoft MakeCode package for for Seeed Studio Grove module.

## Basic usage

### Grove - Gesture

Create gesture events.

```blocks
grove.onGesture(GroveGesture.Up, () => {
    basic.showString("Up")
})
grove.onGesture(GroveGesture.Down, () => {
    basic.showString("Down")
})
```

### Grove - Ultrasonic Ranger

Measure distance in centimeters, specify the signal pin.

```blocks
let distance = 0
distance = grove.measureInCentimeters(DigitalPin.P0)
```

Measure distance in inches, specify the signal pin.

```blocks
let distance = 0
distance = grove.measureInInches(DigitalPin.P0)
```

### Grove - 4 digital display

Create a 4 Digital Display driver, specify the clk and data pin, and set the brightness level, then start display value.

```blocks
let display: grove.TM1637 = null
display = grove.createDisplay(DigitalPin.P0, DigitalPin.P1)
display.set(7)
display.show(1234)
```

## More operation

### Grove - 4 digital display

Use ``||bit||`` to display one bit number.

Use ``||point||`` to open or close point dispay.

Use ``||clear||`` to clean display.

## License

MIT

## Supported targets

* for PXT/microbit
