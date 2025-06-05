/**
 * Grove Temperature & Humidity Sensor (DHT11) support
 */
//% groups='["DHT11"]'
namespace grove {

    /**
    * Connect and setup the Grove Temperature & Humidity Sensor (DHT11)
    * @param signalPin The digital pin connected to the sensor
    * @param serialLogging Enable serial logging for debugging
    * @return A DHT11Helper instance for reading temperature and humidity
    */
    //% block="connect to sensor on %signalPin, serial logging %serialLogging"
    //% signalPin.defl=DigitalPin.P1
    //% blockSetVariable=dht11
    //% group="DHT11"
    //% weight=99
    //% color="#AA278D"
    export function connectToDHT11(signalPin: DigitalPin = DigitalPin.P1, serialLogging: boolean = false): grove.sensors.DHT11Helper {
        return new grove.sensors.DHT11Helper(signalPin, serialLogging);
    }

    /**
     * Read the temperature and humidity from the sensor
     * @param sensor The DHT11Helper instance
     * @param forceRead Force a read operation even if the last read was recent
     * @return True if the read was successful, false otherwise
     */
    //% block="read temperature and humidity from $sensor, force read %forceRead"
    //% sensor.defl=dht11
    //% sensor.shadow=variables_get
    //% group="DHT11"
    //% weight=98
    //% color="#008B8D"
    export function readTemperatureHumidity(sensor: grove.sensors.DHT11Helper, forceRead: boolean = false): boolean {
        if (sensor) {
            return sensor.readSensorData(forceRead);
        }
        return false;
    }


    /**
     * Get the humidity in percentage
     * @param sensor The DHT11Helper instance
     * @param autoRead Automatically read the sensor data before getting humidity
     * @return The humidity value in percentage, or NaN if the sensor is not connected
     */
    //% block="get humidity from $sensor"
    //% sensor.defl=dht11
    //% sensor.shadow=variables_get
    //% group="DHT11"
    //% weight=89
    export function getHumidity(sensor: grove.sensors.DHT11Helper, autoRead: boolean = true): number {
        if (sensor) {
            if (autoRead) {
                sensor.readSensorData();
            }
            return sensor.humidity;
        }
        return NaN;
    }

    /**
     * Get the temperature in Celsius
     * @param sensor The DHT11Helper instance
     * @param autoRead Automatically read the sensor data before getting temperature
     * @return The temperature value in Celsius, or NaN if the sensor is not connected
     */
    //% block="get temperature in celsius from $sensor"
    //% sensor.defl=dht11
    //% sensor.shadow=variables_get
    //% group="DHT11"
    //% weight=88
    export function getTemperatureCelsius(sensor: grove.sensors.DHT11Helper, autoRead: boolean = true): number {
        if (sensor) {
            if (autoRead) {
                sensor.readSensorData();
            }
            return sensor.temperature;
        }
        return NaN;
    }

    /**
     * Get the temperature in Fahrenheit
     * @param sensor The DHT11Helper instance
     * @param autoRead Automatically read the sensor data before getting temperature
     * @return The temperature value in Fahrenheit, or NaN if the sensor is not connected
     */
    //% block="get temperature in fahrenheit from $sensor"
    //% sensor.defl=dht11
    //% sensor.shadow=variables_get
    //% group="DHT11"
    //% weight=87
    export function getTemperatureFahrenheit(sensor: grove.sensors.DHT11Helper, autoRead: boolean = true): number {
        if (sensor) {
            if (autoRead) {
                sensor.readSensorData();
            }
            const celsius = sensor.temperature;
            return (celsius * 1.8) + 32;
        }
        return NaN;
    }

}
