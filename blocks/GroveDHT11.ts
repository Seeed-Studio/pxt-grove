/**
 * Grove Temperature & Humidity Sensor (DHT11) support
 */
//% groups='["DHT11"]'
namespace grove {

    /**
    * Connect and setup the Grove Temperature & Humidity Sensor (DHT11)
    */
    //% block="connect to sensor on %signalPin, serial logging %serialLogging"
    //% signalPin.defl=DigitalPin.P1
    //% blockSetVariable=dht11
    //% group="DHT11"
    //% weight=99
    //% color="#AA278D"
    export function connectToDHT11(signalPin: DigitalPin = DigitalPin.P1, serialLogging: boolean = false): grove.sensors.DHT11 {
        return new grove.sensors.DHT11(signalPin, serialLogging);
    }

    /**
     * Read the temperature and humidity from the sensor
     */
    //% block="read temperature and humidity from $sensor"
    //% sensor.defl=dht11
    //% sensor.shadow=variables_get
    //% group="DHT11"
    //% weight=98
    //% color="#AA278D"
    export function readTemperatureHumidity(sensor: grove.sensors.DHT11, forceRead: boolean = false): boolean {
        if (sensor) {
            return sensor.readSensorData(forceRead);
        }
        return false;
    }


    /**
     * Get the humidity in percentage
     */
    //% block="get humidity from $sensor"
    //% sensor.defl=dht11
    //% sensor.shadow=variables_get
    //% group="DHT11"
    //% weight=89
    export function getHumidity(sensor: grove.sensors.DHT11): number {
        if (sensor) {
            return sensor.humidity;
        }
        return -999;
    }

    /**
     * Get the temperature in Celsius
     */
    //% block="get temperature in celsius from $sensor"
    //% sensor.defl=dht11
    //% sensor.shadow=variables_get
    //% group="DHT11"
    //% weight=88
    export function getTemperatureCelsius(sensor: grove.sensors.DHT11): number {
        if (sensor) {
            return sensor.temperature;
        }
        return -999;
    }

    /**
     * Get the temperature in Fahrenheit
     */
    //% block="get temperature in fahrenheit from $sensor"
    //% sensor.defl=dht11
    //% sensor.shadow=variables_get
    //% group="DHT11"
    //% weight=87
    export function getTemperatureFahrenheit(sensor: grove.sensors.DHT11): number {
        if (sensor) {
            const celsius = sensor.temperature;
            return (celsius * 9 / 5) + 32;
        }
        return -999;
    }

}
