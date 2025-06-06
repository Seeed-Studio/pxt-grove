/**
 * Grove Color Sensor (VEML6040) support
 */
//% groups='["VEML6040"]'
namespace grove {

    /**
     * Connect and setup the Grove Color Sensor (VEML6040)
     * @param serialLogging Enable serial logging for debugging
     * @return A VEML6040 instance for reading color values
     */
    //% block="connect to sensor, serial logging %serialLogging"
    //% blockSetVariable=veml6040
    //% group="VEML6040"
    //% weight=99
    //% color="#AA278D"
    export function connectToVEML6040(serialLogging: boolean = false): grove.sensors.VEML6040 {
        let sensor = new grove.sensors.VEML6040(0x10, serialLogging);
        sensor.connect();
        return sensor;
    }

    /**
     * Read the red color strength from the sensor
     * @param sensor The VEML6040 instance
     * @return The red color strength if successful, otherwise NaN
     */
    //% block="read red color level from $sensor"
    //% sensor.defl=veml6040
    //% sensor.shadow=variables_get
    //% group="VEML6040"
    //% weight=89
    export function readColorRed(sensor: grove.sensors.VEML6040): number {
        if (sensor) {
            return sensor.readRed();
        }
        return NaN;
    }

    /**
     * Read the green color strength from the sensor
     * @param sensor The VEML6040 instance
     * @return The green color strength if successful, otherwise NaN
     */
    //% block="read green color level from $sensor"
    //% sensor.defl=veml6040
    //% sensor.shadow=variables_get
    //% group="VEML6040"
    //% weight=88
    export function readColorGreen(sensor: grove.sensors.VEML6040): number {
        if (sensor) {
            return sensor.readGreen();
        }
        return NaN;
    }

    /**
     * Read the blue color strength from the sensor
     * @param sensor The VEML6040 instance
     * @return The blue color strength if successful, otherwise NaN
     */
    //% block="read blue color level from $sensor"
    //% sensor.defl=veml6040
    //% sensor.shadow=variables_get
    //% group="VEML6040"
    //% weight=87
    export function readColorBlue(sensor: grove.sensors.VEML6040): number {
        if (sensor) {
            return sensor.readBlue();
        }
        return NaN;
    }

    /**
     * Read the white color strength from the sensor
     * @param sensor The VEML6040 instance
     * @return The white color strength if successful, otherwise NaN
     */
    //% block="read white color level from $sensor"
    //% sensor.defl=veml6040
    //% sensor.shadow=variables_get
    //% group="VEML6040"
    //% weight=86
    export function readColorWhite(sensor: grove.sensors.VEML6040): number {
        if (sensor) {
            return sensor.readWhite();
        }
        return NaN;
    }

    /**
     * Read the ambient light level from the sensor
     * @param sensor The VEML6040 instance
     * @return The ambient light level in lux if successful, otherwise NaN
     */
    //% block="read ambient light level from $sensor"
    //% sensor.defl=veml6040
    //% sensor.shadow=variables_get
    //% group="VEML6040"
    //% weight=85
    export function readAmbientLight(sensor: grove.sensors.VEML6040): number {
        if (sensor) {
            return sensor.readAmbientLight();
        }
        return NaN;
    }

}
