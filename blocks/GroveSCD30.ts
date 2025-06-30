/**
 * Grove CO2, Temperature & Humidity Sensor (SCD30) support
 */
//% groups='["CO2, Temperature & Humidity Sensor (SCD30)"]'
namespace grove {

    export enum SCD30DataType {
        //% block="CO2"
        CO2 = 0,
        //% block="Humidity"
        Humidity = 1,
        //% block="Temperature"
        Temperature = 2,
        //% block="Celsius Temperature"
        CelsiusTemperature = 3,
        //% block="Farenheit Temperature"
        FarenheitTemperature = 4
    };

    let _scd30: grove.sensors.SCD30 = null;

    /**
     * Read humidity and temperature data from the SCD30 sensor.
     * @param dataType The type of data to read (CO2, Humidity, Temperature, CelsiusTemperature, FarenheitTemperature)
     * @param serialLogging Whether to enable serial logging for debugging
     * @return The requested data value, or NaN if the sensor is not connected or read failed
     */
    //% block="read %dataType from SCD30"
    //% group="CO2, Temperature & Humidity Sensor (SCD30)"
    //% weight=99
    export function readDataFromSCD30(dataType: SCD30DataType, serialLogging: boolean = false): number {
        if (!_scd30) {
            _scd30 = new grove.sensors.SCD30(0x61, serialLogging);
            while (!_scd30.connect());
        }
        if (!_scd30.isConnected()) {
            _scd30 = null;
            return NaN;
        }

        if (!_scd30.readSensorData()) {
            return NaN;
        }

        switch (dataType) {
            case SCD30DataType.CO2:
                return _scd30.co2;
            case SCD30DataType.Humidity:
                return _scd30.humidity;
            case SCD30DataType.Temperature:
                return _scd30.temperature;
            case SCD30DataType.CelsiusTemperature:
                return _scd30.temperature;
            case SCD30DataType.FarenheitTemperature:
                return _scd30.temperature * 9 / 5 + 32;
            default:
                break;
        }

        return NaN;
    }

}
