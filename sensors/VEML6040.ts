namespace grove {

    export namespace sensors {

        export enum VEML6040MeasurementMode {
            Auto,
            Manual,
        };

        export enum VEML6040IntegrationTime {
            IT_40MS = 0x00,
            IT_80MS = 0x10,
            IT_160MS = 0x20,
            IT_320MS = 0x30,
            IT_640MS = 0x40,
            IT_1280MS = 0x50,
        };

        export enum VEML6040Command {
            CONFIG = 0x00,
            R_DATA = 0x08,
            G_DATA = 0x09,
            B_DATA = 0x0A,
            W_DATA = 0x0B,
        };

        export const VEML6040GSensitivity = {
            [VEML6040IntegrationTime.IT_40MS]: 0.25168,
            [VEML6040IntegrationTime.IT_80MS]: 0.12584,
            [VEML6040IntegrationTime.IT_160MS]: 0.06292,
            [VEML6040IntegrationTime.IT_320MS]: 0.03146,
            [VEML6040IntegrationTime.IT_640MS]: 0.01573,
            [VEML6040IntegrationTime.IT_1280MS]: 0.00787,
        };

        export const VEML6040LuxRange = {
            [VEML6040IntegrationTime.IT_40MS]: 16496,
            [VEML6040IntegrationTime.IT_80MS]: 8248,
            [VEML6040IntegrationTime.IT_160MS]: 4124,
            [VEML6040IntegrationTime.IT_320MS]: 2062,
            [VEML6040IntegrationTime.IT_640MS]: 1031,
            [VEML6040IntegrationTime.IT_1280MS]: 515.4,
        };

        export const VEML6040SyncDelay = {
            [VEML6040IntegrationTime.IT_40MS]: 200,
            [VEML6040IntegrationTime.IT_80MS]: 200,
            [VEML6040IntegrationTime.IT_160MS]: 200,
            [VEML6040IntegrationTime.IT_320MS]: 400,
            [VEML6040IntegrationTime.IT_640MS]: 800,
            [VEML6040IntegrationTime.IT_1280MS]: 1600,
        };

        export class VEML6040 {
            private i2cAddr: number;
            private loggingToSerial: boolean;
            private lastSyncTime: number;
            private configRegisters: Buffer;
            private measurementMode: VEML6040MeasurementMode;
            private integrationTime: VEML6040IntegrationTime;

            private static bitFieldMap = {
                "SHUTDOWN": 1 << 0,
                "AF": 1 << 1,
                "TRIG": 1 << 2,
            }

            private LOG(msg: string): void {
                if (this.loggingToSerial) {
                    serial.writeLine(msg);
                }
            }

            public constructor(i2cAddr: number = 0x10, loggingToSerial: boolean = false) {
                this.i2cAddr = i2cAddr;
                this.loggingToSerial = loggingToSerial;
                this.lastSyncTime = 0;
                this.configRegisters = pins.createBuffer(2);
                this.configRegisters.fill(0);
                this.measurementMode = VEML6040MeasurementMode.Auto;
                this.integrationTime = VEML6040IntegrationTime.IT_160MS;
            }

            public connect(): boolean {
                if (!this.isConnected()) {
                    this.LOG("VEML6040 is not connected on I2C address: " + this.i2cAddr.toString());
                    return false;
                }
                let config = this.configRegisters.getNumber(NumberFormat.UInt8LE, 0);
                config &= ~VEML6040.bitFieldMap.SHUTDOWN;
                this.configRegisters.setNumber(NumberFormat.UInt8LE, 0, config);
                let success = this.writeRegister(VEML6040Command.CONFIG, this.configRegisters);
                if (!success) {
                    this.LOG("VEML6040 failed to write CONFIG register, value: " + config.toString());
                }
                return this.setIntegrationTime(this.integrationTime) && this.setMeasurementMode(this.measurementMode);
            }

            public disconnect(): boolean {
                let config = this.configRegisters.getNumber(NumberFormat.UInt8LE, 0);
                config |= VEML6040.bitFieldMap.SHUTDOWN;
                this.configRegisters.setNumber(NumberFormat.UInt8LE, 0, config);
                let success = this.writeRegister(VEML6040Command.CONFIG, this.configRegisters);
                if (!success) {
                    this.LOG("VEML6040 failed to write CONFIG register, value: " + config.toString());
                }
                return success;
            }

            public setIntegrationTime(integrationTime: VEML6040IntegrationTime): boolean {
                this.integrationTime = integrationTime;
                let config = this.configRegisters.getNumber(NumberFormat.UInt8LE, 0);
                config = (config & ~0x70) | integrationTime;
                this.configRegisters.setNumber(NumberFormat.UInt8LE, 0, config);
                let success = this.writeRegister(VEML6040Command.CONFIG, this.configRegisters);
                if (!success) {
                    this.LOG("VEML6040 failed to write CONFIG register, value: " + config.toString());
                }
                this.lastSyncTime = control.millis();
                return success;
            }

            public getIntegrationTimeMs(): number {
                return VEML6040SyncDelay[this.integrationTime];
            }

            public getGSensitivity(): number {
                return VEML6040GSensitivity[this.integrationTime];
            }

            public getLuxRange(): number {
                return VEML6040LuxRange[this.integrationTime];
            }

            public setMeasurementMode(mode: VEML6040MeasurementMode): boolean {
                this.measurementMode = mode;
                let config = this.configRegisters.getNumber(NumberFormat.UInt8LE, 0);
                if (mode == VEML6040MeasurementMode.Auto) {
                    config &= ~VEML6040.bitFieldMap.AF;
                } else if (mode == VEML6040MeasurementMode.Manual) {
                    config |= VEML6040.bitFieldMap.AF;
                }
                this.configRegisters.setNumber(NumberFormat.UInt8LE, 0, config);
                let success = this.writeRegister(VEML6040Command.CONFIG, this.configRegisters);
                if (!success) {
                    this.LOG("VEML6040 failed to write CONFIG register, value: " + config.toString());
                }
                this.lastSyncTime = control.millis();
                return success;
            }

            public triggerMeasurement(): boolean {
                let config = this.configRegisters.getNumber(NumberFormat.UInt8LE, 0);
                config |= VEML6040.bitFieldMap.TRIG;
                this.configRegisters.setNumber(NumberFormat.UInt8LE, 0, config);
                let success = this.writeRegister(VEML6040Command.CONFIG, this.configRegisters);
                if (!success) {
                    this.LOG("VEML6040 failed to write CONFIG register, value: " + config.toString());
                }
                this.lastSyncTime = control.millis();
                return success;
            }

            public readRed(retry: number = 5): number {
                let attempts = 0;
                while (++attempts <= retry) {
                    let currentTime = control.millis();
                    let timeToWait = VEML6040SyncDelay[this.integrationTime] - (currentTime - this.lastSyncTime);
                    if (timeToWait > 0) {
                        this.LOG("VEML6040 waiting for " + timeToWait + " ms before reading red data");
                        control.waitMicros(1000 * timeToWait);
                    }

                    let buffer = this.readRegister(VEML6040Command.R_DATA, 2);
                    if (!buffer || buffer.length < 2) {
                        this.LOG("VEML6040 [" + attempts.toString() + "] read R_DATA register failed, expected 2 bytes, got " + (buffer ? buffer.length : "null"));
                        control.waitMicros(1000 * 10);
                        continue;
                    }
                    if (this.measurementMode == VEML6040MeasurementMode.Manual) {
                        this.lastSyncTime = control.millis();
                    }
                    let redValueLow = buffer.getNumber(NumberFormat.UInt8LE, 0);
                    let redValueHigh = buffer.getNumber(NumberFormat.UInt8LE, 1);
                    let redValue = (redValueHigh << 8) | redValueLow;
                    return redValue;
                }

                return NaN;
            }

            public readGreen(retry: number = 5): number {
                let attempts = 0;
                while (++attempts <= retry) {
                    let currentTime = control.millis();
                    let timeToWait = VEML6040SyncDelay[this.integrationTime] - (currentTime - this.lastSyncTime);
                    if (timeToWait > 0) {
                        this.LOG("VEML6040 waiting for " + timeToWait + " ms before reading green data");
                        control.waitMicros(1000 * timeToWait);
                    }

                    let buffer = this.readRegister(VEML6040Command.G_DATA, 2);
                    if (!buffer || buffer.length < 2) {
                        this.LOG("VEML6040 [" + attempts.toString() + "] read G_DATA register failed, expected 2 bytes, got " + (buffer ? buffer.length : "null"));
                        control.waitMicros(1000 * 10);
                        continue;
                    }
                    if (this.measurementMode == VEML6040MeasurementMode.Manual) {
                        this.lastSyncTime = control.millis();
                    }
                    let greenValueLow = buffer.getNumber(NumberFormat.UInt8LE, 0);
                    let greenValueHigh = buffer.getNumber(NumberFormat.UInt8LE, 1);
                    let greenValue = (greenValueHigh << 8) | greenValueLow;
                    return greenValue;
                }

                return NaN;
            }

            public readBlue(retry: number = 5): number {
                let attempts = 0;
                while (++attempts <= retry) {
                    let currentTime = control.millis();
                    let timeToWait = VEML6040SyncDelay[this.integrationTime] - (currentTime - this.lastSyncTime);
                    if (timeToWait > 0) {
                        this.LOG("VEML6040 waiting for " + timeToWait + " ms before reading blue data");
                        control.waitMicros(1000 * timeToWait);
                    }

                    let buffer = this.readRegister(VEML6040Command.B_DATA, 2);
                    if (!buffer || buffer.length < 2) {
                        this.LOG("VEML6040 [" + attempts.toString() + "] read B_DATA register failed, expected 2 bytes, got " + (buffer ? buffer.length : "null"));
                        control.waitMicros(1000 * 10);
                        continue;
                    }
                    if (this.measurementMode == VEML6040MeasurementMode.Manual) {
                        this.lastSyncTime = control.millis();
                    }
                    let blueValueLow = buffer.getNumber(NumberFormat.UInt8LE, 0);
                    let blueValueHigh = buffer.getNumber(NumberFormat.UInt8LE, 1);
                    let blueValue = (blueValueHigh << 8) | blueValueLow;
                    return blueValue;
                }

                return NaN;
            }

            public readWhite(retry: number = 5): number {
                let attempts = 0;
                while (++attempts <= retry) {
                    let currentTime = control.millis();
                    let timeToWait = VEML6040SyncDelay[this.integrationTime] - (currentTime - this.lastSyncTime);
                    if (timeToWait > 0) {
                        this.LOG("VEML6040 waiting for " + timeToWait + " ms before reading white data");
                        control.waitMicros(1000 * timeToWait);
                    }

                    let buffer = this.readRegister(VEML6040Command.W_DATA, 2);
                    if (!buffer || buffer.length < 2) {
                        this.LOG("VEML6040 [" + attempts.toString() + "] read W_DATA register failed, expected 2 bytes, got " + (buffer ? buffer.length : "null"));
                        control.waitMicros(1000 * 10);
                        continue;
                    }
                    if (this.measurementMode == VEML6040MeasurementMode.Manual) {
                        this.lastSyncTime = control.millis();
                    }
                    let whiteValueLow = buffer.getNumber(NumberFormat.UInt8LE, 0);
                    let whiteValueHigh = buffer.getNumber(NumberFormat.UInt8LE, 1);
                    let whiteValue = (whiteValueHigh << 8) | whiteValueLow;
                    return whiteValue;
                }

                return NaN;
            }

            public readRGBW(retry: number = 5): { red: number, green: number, blue: number, white: number } {
                let attempts = 0;
                while (++attempts <= retry) {
                    let currentTime = control.millis();
                    let timeToWait = VEML6040SyncDelay[this.integrationTime] - (currentTime - this.lastSyncTime);
                    if (timeToWait > 0) {
                        this.LOG("VEML6040 waiting for " + timeToWait + " ms before reading RGBW data");
                        control.waitMicros(1000 * timeToWait);
                    }
                    let buffer = this.readRegister(VEML6040Command.R_DATA, 8);
                    if (!buffer || buffer.length < 8) {
                        this.LOG("VEML6040 [" + attempts.toString() + "] read RGBW data failed, expected 8 bytes, got " + (buffer ? buffer.length : "null"));
                        return { red: NaN, green: NaN, blue: NaN, white: NaN };
                    }
                    if (this.measurementMode == VEML6040MeasurementMode.Manual) {
                        this.lastSyncTime = control.millis();
                    }
                    return {
                        red: (buffer.getNumber(NumberFormat.UInt8LE, 1) << 8) | buffer.getNumber(NumberFormat.UInt8LE, 0),
                        green: (buffer.getNumber(NumberFormat.UInt8LE, 3) << 8) | buffer.getNumber(NumberFormat.UInt8LE, 2),
                        blue: (buffer.getNumber(NumberFormat.UInt8LE, 5) << 8) | buffer.getNumber(NumberFormat.UInt8LE, 4),
                        white: (buffer.getNumber(NumberFormat.UInt8LE, 7) << 8) | buffer.getNumber(NumberFormat.UInt8LE, 6),
                    };
                }
                return { red: NaN, green: NaN, blue: NaN, white: NaN };
            }

            public readAmbientLight(retry: number = 5): number {
                let g = this.readGreen(retry);
                if (isNaN(g)) {
                    this.LOG("Failed to read green channel, cannot calculate ambient light.");
                    return NaN;
                }
                return g * VEML6040GSensitivity[this.integrationTime];
            }

            public isConnected(): boolean {
                let buf = pins.createBuffer(1);
                buf.setNumber(NumberFormat.UInt8LE, 0, 0);
                return pins.i2cWriteBuffer(this.i2cAddr, buf, false) == 0;
            }

            private writeRegister(command: VEML6040Command, data: Buffer): boolean {
                let buffer = pins.createBuffer(data.length + 1);
                buffer.setNumber(NumberFormat.UInt8LE, 0, command);
                for (let i = 0; i < data.length; ++i) {
                    buffer.setNumber(NumberFormat.UInt8LE, i + 1, data.getNumber(NumberFormat.UInt8LE, i));
                }
                return pins.i2cWriteBuffer(this.i2cAddr, buffer, false) == 0;
            }

            private readRegister(command: VEML6040Command, bytes: number): Buffer {
                let regBuffer = pins.createBuffer(1);
                let response = pins.createBuffer(bytes);
                let received = 0;
                regBuffer.setNumber(NumberFormat.UInt8LE, 0, command);
                pins.i2cWriteBuffer(this.i2cAddr, regBuffer, true);
                while (received < bytes) {
                    const buf = pins.i2cReadBuffer(this.i2cAddr, 1, true);
                    if (buf != null) {
                        response.setUint8(received++, buf.getUint8(0));
                    }
                }
                pins.i2cReadBuffer(this.i2cAddr, 0, false);
                return response
            }

        };
    }
}
