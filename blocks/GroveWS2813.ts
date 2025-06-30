/**
 * Grove RGB LED strip (WS2813) support
 */
//% groups='["RGB LED (WS2813)"]'
namespace grove {

    /**
     * Connect and setup the Grove RGB LED strip (WS2813)
     * @param signalPin The digital pin connected to the strip
     * @param numLEDs The number of LEDs in the strip
     * @return A neopixel.Strip instance for controlling the LED strip
     */
    //% block="connect to color strip on %signalPin with %numLEDs LED(s)"
    //% signalPin.defl=DigitalPin.P1
    //% numLEDs.defl=16
    //% group="RGB LED (WS2813)"
    //% weight=99
    //% blockSetVariable=strip
    export function connectToWS2813Strip(
        signalPin: DigitalPin = DigitalPin.P1,
        numLEDs: number = 16,
    ): neopixel.Strip {
        let strip = neopixel.create(signalPin, numLEDs, NeoPixelMode.RGB);
        strip.setBrightness(100);
        strip.show();
        return strip;
    }


    /**
     * Show a color on the WS2813 strip
     * @param strip The neopixel.Strip instance
     * @param color The color to show (default is Red)
     */
    //% block="change color strip $strip to color $color"
    //% strip.defl=strip
    //% color.defl=NeoPixelColors.Red
    //% strip.shadow=variables_get
    //% group="RGB LED (WS2813)"
    //% weight=89
    export function showColorOnWS2813Strip(
        strip: neopixel.Strip,
        color: NeoPixelColors = NeoPixelColors.Red
    ): void {
        const length = strip.length();
        for (let i = 0; i < length; ++i) {
            strip.setPixelColor(i, color);
        }
        strip.show();
    }

    /**
     * Clear the WS2813 strip
     * @param strip The neopixel.Strip instance
     */
    //% block="clear color strip $strip"
    //% strip.defl=strip
    //% strip.shadow=variables_get
    //% group="RGB LED (WS2813)"
    //% weight=88
    export function clearWS2813Strip(strip: neopixel.Strip): void {
        strip.clear();
        strip.show();
    }

    /**
     * Show a color at a specific index on the WS2813 strip
     * @param strip The neopixel.Strip instance
     * @param index The index of the LED to change
     * @param color The color to show (default is Red)
     */
    //% block="change color strip $strip at index %index to color $color"
    //% strip.defl=strip
    //% index.defl=0
    //% color.defl=NeoPixelColors.Red
    //% strip.shadow=variables_get
    //% group="RGB LED (WS2813)"
    //% weight=87
    export function showColorAtIndexOnWS2813Strip(
        strip: neopixel.Strip,
        index: number,
        color: NeoPixelColors = NeoPixelColors.Red
    ): void {
        if (index < 0 || index >= strip.length()) {
            return;
        }
        strip.setPixelColor(index, color);
        strip.show();
    }

    /**
     * Clear a specific index on the WS2813 strip
     * @param strip The neopixel.Strip instance
     * @param index The index of the LED to clear
     */
    //% block="clear color strip $strip at index %index"
    //% strip.defl=strip
    //% index.defl=0
    //% strip.shadow=variables_get
    //% group="RGB LED (WS2813)"
    //% weight=86
    export function clearAtIndexOnWS2813Strip(strip: neopixel.Strip, index: number): void {
        if (index < 0 || index >= strip.length()) {
            return;
        }
        strip.setPixelColor(index, NeoPixelColors.Black);
        strip.show();
    }

    /**
     * Set the brightness of the WS2813 strip
     * @param strip The neopixel.Strip instance
     * @param brightness The brightness level (0-255)
     */
    //% block="set brightness of color strip $strip to %brightness"
    //% strip.defl=strip
    //% brightness.defl=100
    //% strip.shadow=variables_get
    //% group="RGB LED (WS2813)"
    //% weight=85
    export function setBrightnessOnWS2813Strip(strip: neopixel.Strip, brightness: number): void {
        if (brightness < 0 || brightness > 255) {
            return;
        }
        strip.setBrightness(brightness);
        strip.show();
    }

    /**
     * Show a custom color on the WS2813 strip
     * @param strip The neopixel.Strip instance
     * @param red The red component (0-255)
     * @param green The green component (0-255)
     * @param blue The blue component (0-255)
     */
    //% block="change color strip $strip to custom color R: %red G: %green B: %blue"
    //% strip.defl=strip
    //% red.defl=255
    //% green.defl=0
    //% blue.defl=0
    //% strip.shadow=variables_get
    //% group="RGB LED (WS2813)"
    //% weight=85
    export function showCustomColorOnWS2813Strip(
        strip: neopixel.Strip,
        red: number = 255,
        green: number = 0,
        blue: number = 0
    ): void {
        const length = strip.length();
        for (let i = 0; i < length; ++i) {
            strip.setPixelColor(i, neopixel.rgb(red, green, blue));
        }
        strip.show();
    }

    /**
     * Show a custom color at a specific index on the WS2813 strip
     * @param strip The neopixel.Strip instance
     * @param index The index of the LED to change
     * @param red The red component (0-255)
     * @param green The green component (0-255)
     * @param blue The blue component (0-255)
     */
    //% block="change color strip $strip at index %index to custom color R: %red G: %green B: %blue"
    //% strip.defl=strip
    //% index.defl=0
    //% red.defl=255
    //% green.defl=0
    //% blue.defl=0
    //% strip.shadow=variables_get
    //% group="RGB LED (WS2813)"
    //% weight=84
    export function showCustomColorAtIndexOnWS2813Strip(
        strip: neopixel.Strip,
        index: number,
        red: number = 255,
        green: number = 0,
        blue: number = 0
    ): void {
        if (index < 0 || index >= strip.length()) {
            return;
        }
        strip.setPixelColor(index, neopixel.rgb(red, green, blue));
        strip.show();
    }

}
