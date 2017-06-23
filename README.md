# Grove

A Microsoft MakeCode package for for Seeed Studio Grove module.

## Basic usage

Grove - Gesture
```blocks
// Create gesture events
grove.onGesture(GroveGesture.Up, () => {
    basic.showString("Up")
})

grove.onGesture(GroveGesture.Down, () => {
    basic.showString("Down")
})
```

Grove - Ultrasonic Ranger
```blocks
// Measure distance in centimeters, specify the signal pin
let distance = Grove_Ultrasonic_Ranger.measureInCentimeters(DigitalPin.P0);

// Measure distance in inches, specify the signal pin
let distance = Grove_Ultrasonic_Ranger.measureInInches(DigitalPin.P0);
```

Grove - 4 digital display
```blocks
// Create a 4 Digital Display driver, specify the clk and data pin
let display = Grove_4_Digital_Display.create(DigitalPin.P0, DigitalPin.P1);

// Set the brightness level
display.set(BrightnessLevel.LEVEL_7);

// Start display value
display.show(1234);
```

## More operation

Grove - 4 digital display
```blocks
// After create a 4 Digital Display driver, it can display number "1234" one by one
display.bit(0, 1);
display.bit(1, 2)
display.bit(2, 3);
display.bit(3, 4)
```

Use ``point()`` to open or close point dispay.

Use ``clear()`` to clean display.

## License

MIT

## Supported targets

* for PXT/microbit
(The metadata above is needed for package search.)

