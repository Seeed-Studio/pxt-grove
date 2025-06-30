/**
 * Grove Temperature & Humidity Sensor (DHT20) support
 */
//% groups='["Temperature & Humidity Sensor (DHT20)"]'
namespace grove {

    export enum DHT20DataType {
        //% block="Humidity"
        Humidity = 0,
        //% block="Temperature"
        Temperature = 1,
        //% block="Celsius Temperature"
        CelsiusTemperature = 1,
        //% block="Farenheit Temperature"
        FarenheitTemperature = 2
    };

    let _dht20: grove.sensors.DHT20 = null;

    /**
     * Read humidity and temperature data from the DHT20 sensor.
     * @param dataType The type of data to read (Humidity, Temperature, CelsiusTemperature, FarenheitTemperature)
     * @param serialLogging Whether to enable serial logging for debugging
     * @return The requested data value, or NaN if the sensor is not connected or read failed
     */
    //% block="read %dataType from DHT20"
    //% group="Temperature & Humidity Sensor (DHT20)"
    //% weight=99
    export function readDataFromDHT20(dataType: DHT20DataType, serialLogging: boolean = false): number {
        if (!_dht20) {
            _dht20 = new grove.sensors.DHT20(0x38, serialLogging);
            while (!_dht20.connect());
        }
        if (!_dht20.isConnected()) {
            _dht20 = null;
            return NaN;
        }

        if (!_dht20.readSensorData()) {
            return NaN;
        }

        switch (dataType) {
            case DHT20DataType.Humidity:
                return _dht20.humidity;
            case DHT20DataType.Temperature:
                return _dht20.temperature;
            case DHT20DataType.CelsiusTemperature:
                return _dht20.temperature;
            case DHT20DataType.FarenheitTemperature:
                return _dht20.temperature * 9 / 5 + 32;
            default:
                break;
        }

        return NaN;
    }

}
