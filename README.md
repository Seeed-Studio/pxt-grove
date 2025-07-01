# Grove

A Microsoft MakeCode package for for Seeed Studio Grove module.

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

### Grove - LCD 16x2

Show string and number after initialize LCD.

```blocks
grove.lcd_init()
grove.lcd_show_string("Hello", 0, 0)
grove.lcd_show_number(12345, 0, 1)
```


### Grove Temperature & Humidity Sensor (DHT11)

Read the temperature and humidity from the Grove Temperature & Humidity Sensor.

```blocks
serial.redirectToUSB();

let dht11 = grove.connectToDHT11(DigitalPin.P1, false);

basic.forever(function () {
    if (grove.readTemperatureHumidity(dht11)) {
        serial.writeLine("New data received:");
        serial.writeValue("humidity", grove.getHumidity(dht11));
        serial.writeValue("temperature", grove.getTemperatureCelsius(dht11));
    } else {
        serial.writeLine("Fail to read, try again later");
    }
    basic.pause(2000);
})
```

### Grove - Temperature & Humidity Sensor (DHT20)

```blocks
basic.forever(function () {
    basic.showNumber(grove.readDataFromDHT20(grove.DHT20DataType.Humidity))
    basic.pause(1000)
    serial.writeLine("" + (grove.readDataFromDHT20(grove.DHT20DataType.Temperature)))
    serial.writeLine("" + (grove.readDataFromDHT20(grove.DHT20DataType.CelsiusTemperature)))
    serial.writeLine("" + (grove.readDataFromDHT20(grove.DHT20DataType.FarenheitTemperature)))
    basic.pause(2000)
})
```

### Grove - Color Sensor (VEML6040)

This demo shows how to get the red color level from Grove Color Sensor and display the number on serial port and the LED matrix of Microbit.

```blocks
basic.forever(function () {
    serial.writeNumber(grove.readColorFromVEML6040(grove.Color.Red));
    basic.pause(3000)
})
```

### Grove - Vision AI Module V2

Connect the Grove Vision AI Module V2 through I2C and get AI inference results.

Before uploading the code, make sure you have deployed the model on the AI Module V2. [Click here to deploy.](https://sensecraft.seeed.cc/ai/model)

We use People Detection model and Gesture Detection model as examples.

This demo shows how to get the number of detected gesture of Rock, Paper, Scissors,  and dispay the number on the LED matrix of Microbit.

```blocks
let person_num = 0
serial.redirectToUSB()
grove.connectAndSetupGroveVisionAIV2(
true
)
while (!(grove.startAIInference())) {
    serial.writeLine("Fail to initialize")
    basic.pause(5000)
}
basic.forever(function () {
    if (grove.fetchAIInferenceResults()) {
        if (grove.containsObjectName(["Rock", "Paper", "Scissors"])) {
            person_num = grove.countObjectByName(["Rock", "Paper", "Scissors"])
            basic.showNumber(person_num)
            basic.pause(2000)
        } else {
            basic.showIcon(IconNames.No)
        }
    }
    basic.pause(1000)
})
```

This demo will teach you how to use callback functions to print the recognized information in the serial port.

```blocks
grove.onReceiveDetectionResult(function (detectionResults) {
    for (let detectionResult of detectionResults) {
        serial.writeLine(detectionResult.toString())
    }
})

let persons = 0

serial.redirectToUSB()
grove.connectAndSetupGroveVisionAIV2(true)

while (!(grove.startAIInference())) {
    serial.writeLine("Failed to start inference")
    basic.pause(1000)
}

basic.forever(function () {
    if (grove.fetchAIInferenceResults()) {
        serial.writeLine("Fetch inference result success")
        if (grove.containsObjectName(["person"])) {
            persons = grove.countObjectByName(["person"])
            serial.writeString("Detected persons: ")
            serial.writeNumber(persons)
            serial.writeLine("" + ("\n"))
        }
    }
    basic.pause(100)
})
```

### Grove - RGB LED Ring (WS2813)

```blocks
let strip: neopixel.Strip = null
basic.forever(function () {
    strip = grove.connectToWS2813Strip(DigitalPin.P1, 16)
    basic.pause(2000)
    grove.showColorOnWS2813Strip(strip, NeoPixelColors.Yellow)
    basic.pause(2000)
    grove.clearWS2813Strip(strip)
    basic.pause(2000)
    grove.showColorAtIndexOnWS2813Strip(strip, 0, NeoPixelColors.Red)
    grove.showColorAtIndexOnWS2813Strip(strip, 4, NeoPixelColors.Yellow)
    grove.showColorAtIndexOnWS2813Strip(strip, 8, NeoPixelColors.Green)
    grove.showColorAtIndexOnWS2813Strip(strip, 12, NeoPixelColors.Blue)
    basic.pause(2000)
})
```

### Grove - CO2, Temperature & Humidity Sensor (SCD30)

```blocks
basic.forever(function () {
    basic.showNumber(grove.readDataFromSCD30(grove.SCD30DataType.CO2))
    basic.pause(1000)
    serial.writeLine("" + (grove.readDataFromSCD30(grove.SCD30DataType.Humidity)))
    serial.writeLine("" + (grove.readDataFromSCD30(grove.SCD30DataType.Temperature)))
    serial.writeLine("" + (grove.readDataFromSCD30(grove.SCD30DataType.CelsiusTemperature)))
    serial.writeLine("" + (grove.readDataFromSCD30(grove.SCD30DataType.FarenheitTemperature)))
    basic.pause(2000)
})
```

### Grove - CO2, Temperature & Humidity Sensor (SCD41)

```blocks
basic.forever(function () {
    basic.showNumber(grove.readDataFromSCD41(grove.SCD41DataType.CO2))
    basic.pause(1000)
    serial.writeLine("" + (grove.readDataFromSCD41(grove.SCD41DataType.CO2)))
    serial.writeLine("" + (grove.readDataFromSCD41(grove.SCD41DataType.Humidity)))
    serial.writeLine("" + (grove.readDataFromSCD41(grove.SCD41DataType.Temperature)))
    serial.writeLine("" + (grove.readDataFromSCD41(grove.SCD41DataType.CelsiusTemperature)))
    serial.writeLine("" + (grove.readDataFromSCD41(grove.SCD41DataType.FarenheitTemperature)))
    basic.pause(2000)
})
```

### Grove - I2C Mini Motor Driver (DRV8833)

```blocks
basic.forever(function () {
    grove.setSpeedUsingDRV8830NoReturn(grove.DRV8830Addr.Channel2, 50)
    grove.setSpeedUsingDRV8830NoReturn(grove.DRV8830Addr.Channel1, -50)
    basic.pause(1000)
    grove.stopUsingDRV8830NoReturn(grove.DRV8830Addr.Channel2)
    grove.stopUsingDRV8830NoReturn(grove.DRV8830Addr.Channel1)
    basic.pause(100)
    grove.setSpeedUsingDRV8830NoReturn(grove.DRV8830Addr.Channel2, -50)
    grove.setSpeedUsingDRV8830NoReturn(grove.DRV8830Addr.Channel1, 50)
    basic.pause(1000)
    grove.stopUsingDRV8830NoReturn(grove.DRV8830Addr.Channel2)
    grove.stopUsingDRV8830NoReturn(grove.DRV8830Addr.Channel1)
    basic.pause(100)
})
```


## License

MIT

## Supported targets

* for PXT/calliopemini
