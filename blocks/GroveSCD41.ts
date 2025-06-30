/**
 * Grove CO2, Temperature & Humidity Sensor (SCD41) support
 */
//% groups='["CO2, Temperature & Humidity Sensor (SCD41)"]'
namespace grove {

    export enum SCD41DataType {
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

    let _scd41: grove.sensors.SCD41 = null;

    /**
     * Read humidity and temperature data from the SCD41 sensor.
     * @param dataType The type of data to read (CO2, Humidity, Temperature, CelsiusTemperature, FarenheitTemperature)
     * @param serialLogging Whether to enable serial logging for debugging
     * @return The requested data value, or NaN if the sensor is not connected or read failed
     */
    //% block="read %dataType from SCD41"
    //% group="CO2, Temperature & Humidity Sensor (SCD41)"
    //% weight=99
    export function readDataFromSCD41(dataType: SCD41DataType, serialLogging: boolean = false): number {
        if (!_scd41) {
            _scd41 = new grove.sensors.SCD41(0x62, serialLogging);
            while (!_scd41.connect());
        }
        if (!_scd41.isConnected()) {
            _scd41 = null;
            return NaN;
        }

        if (!_scd41.readSensorData()) {
            return NaN;
        }

        switch (dataType) {
            case SCD41DataType.CO2:
                return _scd41.co2;
            case SCD41DataType.Humidity:
                return _scd41.humidity;
            case SCD41DataType.Temperature:
                return _scd41.temperature;
            case SCD41DataType.CelsiusTemperature:
                return _scd41.temperature;
            case SCD41DataType.FarenheitTemperature:
                return _scd41.temperature * 9 / 5 + 32;
            default:
                break;
        }

        return NaN;
    }

}
