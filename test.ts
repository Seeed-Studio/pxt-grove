let _4Digit = grove.createDisplay(DigitalPin.C16, DigitalPin.C17)
grove.setupWifi(
    SerialPin.P15,
    SerialPin.P1,
    BaudRate.BaudRate115200,
    "test-ssid",
    "test-passwd"
)

basic.forever(function () {
    _4Digit.bit(6, 1)
})