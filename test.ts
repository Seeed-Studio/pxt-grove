let _4Digit = grove.createDisplay(DigitalPin.C16, DigitalPin.C17)
basic.forever(function () {
    _4Digit.bit(6, 1)
})