/**
 * Grove Mini I2C Motor Driver support
 */
//% groups='["DRV8830"]'
namespace grove {

    export enum DRV8830Addr {
        //% block="Channel 1"
        Channel1 = 0xCA,
        //% block="Channel 2"
        Channel2 = 0xC0,
    };

    export enum DRV8830Command {
        //% block="Drive"
        SetSpeed = 0x00,
        //% block="Stop"
        Stop = 0x01,
        //% block="Brake"
        Brake = 0x02,
        //% block="Fault"
        Fault = 0x03,
        //% block="Clear Fault"
        ClearFault = 0x04,
    };

    export enum DRV8830Fault {
        //% block="Connection Error"
        ConnectionError = -1,
        //% block="No Fault"
        NoFault = 0x00,
        //% block="Current Limit"
        Fault = 0b00010000,
        //% block="Over Temperature"
        OverTemperature = 0b00001000,
        //% block="Under Voltage"
        UnderVoltage = 0b00000100,
        //% block="Over Current"
        OverCurrent = 0b00000010,
        //% block="Unknow Fault"
        UnknowFault = 0b00000001,
    };


    let _drv8830_channel1: grove.sensors.DRV8830 = null;
    let _drv8830_channel2: grove.sensors.DRV8830 = null;

    function getDRV8830Instance(
        channel: DRV8830Addr,
        serialLogging: boolean = false
    ): grove.sensors.DRV8830 {
        switch (channel) {
            case DRV8830Addr.Channel1:
                if (!_drv8830_channel1) {
                    _drv8830_channel1 = new grove.sensors.DRV8830(DRV8830Addr.Channel1, serialLogging);
                    while (!_drv8830_channel1.connect());
                }
                return _drv8830_channel1;
            case DRV8830Addr.Channel2:
                if (!_drv8830_channel2) {
                    _drv8830_channel2 = new grove.sensors.DRV8830(DRV8830Addr.Channel2, serialLogging);
                    while (!_drv8830_channel2.connect());
                }
                return _drv8830_channel2;
            default:
                return null;
        }
    }

    /**
     * Set the speed of the motor using the DRV8830 driver.
     * @param channel The DRV8830 channel to use (Channel 1 or Channel 2)
     * @param speed The speed to set (-64 to 63)
     */
    //% block="set %channel speed to %speed"
    //% group="DRV8830"
    //% advanced=true
    //% weight=99
    export function setSpeedUsingDRV8830(
        channel: DRV8830Addr = DRV8830Addr.Channel1,
        speed: number = 0
    ): boolean {
        const drv8830 = getDRV8830Instance(channel);
        if (!drv8830) return false;
        return drv8830.setSpeed(speed);
    }

    /**
     * Set the speed of the motor using the DRV8830 driver without returning a value.
     * @param channel The DRV8830 channel to use (Channel 1 or Channel 2)
     * @param speed The speed to set (-64 to 63)
     */
    //% block="set %channel speed to %speed"
    //% group="DRV8830"
    //% weight=99
    export function setSpeedUsingDRV8830NoReturn(
        channel: DRV8830Addr = DRV8830Addr.Channel1,
        speed: number = 0
    ) {
        setSpeedUsingDRV8830(channel, speed);
    }

    /**
     * Stop the motor using the DRV8830 driver.
     * @param channel The DRV8830 channel to use (Channel 1 or Channel 2)
     */
    //% block="stop motor on %channel"
    //% group="DRV8830"
    //% advanced=true
    //% weight=98
    export function stopUsingDRV8830(
        channel: DRV8830Addr = DRV8830Addr.Channel1
    ): boolean {
        const drv8830 = getDRV8830Instance(channel);
        if (!drv8830) return false;
        return drv8830.setStop();
    }

    /**
     * Stop the motor using the DRV8830 driver without returning a value.
     * @param channel The DRV8830 channel to use (Channel 1 or Channel 2)
     */
    //% block="stop motor on %channel"
    //% group="DRV8830"
    //% weight=98
    export function stopUsingDRV8830NoReturn(
        channel: DRV8830Addr = DRV8830Addr.Channel1
    ) {
        stopUsingDRV8830(channel);
    }

    /**
     * Brake the motor using the DRV8830 driver.
     * @param channel The DRV8830 channel to use (Channel 1 or Channel 2)
     */
    //% block="brake motor on %channel"
    //% group="DRV8830"
    //% advanced=true
    //% weight=97
    export function brakeUsingDRV8830(
        channel: DRV8830Addr = DRV8830Addr.Channel1
    ): boolean {
        const drv8830 = getDRV8830Instance(channel);
        if (!drv8830) return false;
        return drv8830.setBrake();
    }

    /**
     * Brake the motor using the DRV8830 driver without returning a value.
     * @param channel The DRV8830 channel to use (Channel 1 or Channel 2)
     */
    //% block="brake motor on %channel"
    //% group="DRV8830"
    //% weight=97
    export function brakeUsingDRV8830NoReturn(
        channel: DRV8830Addr = DRV8830Addr.Channel1
    ) {
        brakeUsingDRV8830(channel);
    }

    /**
     * Get the fault status from the DRV8830 driver.
     * @param channel The DRV8830 channel to use (Channel 1 or Channel 2)
     * @return The fault status as a DRV8830Fault enum value
     */
    //% block="get fault from %channel"
    //% group="DRV8830"
    //% weight=96
    export function getFaultFromDRV8830(
        channel: DRV8830Addr = DRV8830Addr.Channel1
    ): DRV8830Fault {
        const drv8830 = getDRV8830Instance(channel);
        if (!drv8830) return DRV8830Fault.UnknowFault;
        const fault = drv8830.getFault();
        switch (fault) {
            case 0x00:
                return DRV8830Fault.NoFault;
            case 0b00010000:
                return DRV8830Fault.Fault;
            case 0b00001000:
                return DRV8830Fault.OverTemperature;
            case 0b00000100:
                return DRV8830Fault.UnderVoltage;
            case 0b00000010:
                return DRV8830Fault.OverCurrent;
            case 0b00000001:
                return DRV8830Fault.UnknowFault;
            default:
                return DRV8830Fault.ConnectionError;
        }

    }

    /**
     * Clear the fault status on the DRV8830 driver.
     * @param channel The DRV8830 channel to use (Channel 1 or Channel 2)
     * @return True if the fault was cleared successfully, false otherwise
     */
    //% block="clear fault on %channel"
    //% group="DRV8830"
    //% advanced=true
    //% weight=95
    export function clearFaultUsingDRV8830(
        channel: DRV8830Addr = DRV8830Addr.Channel1
    ): boolean {
        const drv8830 = getDRV8830Instance(channel);
        if (!drv8830) return false;
        return drv8830.clearFault();
    }

    /**
     * Clear the fault status on the DRV8830 driver without returning a value.
     * @param channel The DRV8830 channel to use (Channel 1 or Channel 2)
     */
    //% block="clear fault on %channel"
    //% group="DRV8830"
    //% weight=95
    export function clearFaultUsingDRV8830NoReturn(
        channel: DRV8830Addr = DRV8830Addr.Channel1
    ) {
        clearFaultUsingDRV8830(channel);
    }

}
