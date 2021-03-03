/**
 * Grove - AHT20 Custom Block
 */
//% groups=['AHT20']
namespace grove
{
    function Read(aht20: grove.sensors.AHT20): { Humidity: number, Temperature: number }
    {
        if (!aht20.GetState().Calibrated)
        {
            aht20.Initialization();
            if (!aht20.GetState().Calibrated) return null;
        }

        aht20.TriggerMeasurement();
        for (let i = 0; ; ++i)
        {
            if (!aht20.GetState().Busy) break;
            if (i >= 500) return null;
            basic.pause(10);
        }

        return aht20.Read();
    }

    /**
     * Read the temperature(°C) from Grove-AHT20(SKU#101990644)
     */
    //% group="AHT20"
    //% block="[Grove - Temp&Humi Sensor]|Read the temperature(°C))"
    //% weight=3
    export function aht20ReadTemperatureC(): number
    {
        const aht20 = new grove.sensors.AHT20();
        const val = Read(aht20);
        if (val == null) return null;

        return val.Temperature;
    }

    /**
     * Read the temperature(°F) from Grove-AHT20(SKU#101990644)
     */
    //% group="AHT20"
    //% block="[Grove - Temp&Humi Sensor]|Read the temperature(°F))"
    //% weight=2
    export function aht20ReadTemperatureF(): number
    {
        const aht20 = new grove.sensors.AHT20();
        const val = Read(aht20);
        if (val == null) return null;

        return val.Temperature * 9 / 5 + 32;
    }

    /**
     * Read the humidity from Grove-AHT20(SKU#101990644)
     */
    //% group="AHT20"
    //% block="[Grove - Temp&Humi Sensor]|Read the humidity"
    //% weight=1
    export function aht20ReadHumidity(): number
    {
        const aht20 = new grove.sensors.AHT20();
        const val = Read(aht20);
        if (val == null) return null;

        return val.Humidity;
    }

}
