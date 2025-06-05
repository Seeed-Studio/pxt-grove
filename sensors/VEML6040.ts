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

        export enum VEML6040Register {
            CONFIG = 0x00,
            R_DATA = 0x08,
            G_DATA = 0x09,
            B_DATA = 0x0A,
            W_DATA = 0x0B,
        };

        export class VEML6040 {
            private i2cAddr: number;
            private loggingToSerial: boolean;

            private configRegisterBuffer: Buffer;
            private integrationTime: VEML6040IntegrationTime;

            private static gSensitivityMap = {
                [VEML6040IntegrationTime.IT_40MS]: 0.25168,
                [VEML6040IntegrationTime.IT_80MS]: 0.12584,
                [VEML6040IntegrationTime.IT_160MS]: 0.06292,
                [VEML6040IntegrationTime.IT_320MS]: 0.03146,
                [VEML6040IntegrationTime.IT_640MS]: 0.01573,
                [VEML6040IntegrationTime.IT_1280MS]: 0.00787,
            };

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
                this.configRegisterBuffer = pins.createBuffer(3);
                this.configRegisterBuffer.fill(0);
                this.integrationTime = VEML6040IntegrationTime.IT_160MS;
            }

            private syncConfigFromDevice(): void {
                let configBuffer = this.readRegister(VEML6040Register.CONFIG, 2);
                if (configBuffer.length != 2) {
                    this.LOG("VEML6040 read CONFIG register failed, expected 2 bytes, got " + configBuffer.length);
                    return;
                }
                let configValue = configBuffer.getNumber(NumberFormat.UInt8LE, 1);
                this.integrationTime = configValue & 0x70;
                this.configRegisterBuffer.setNumber(NumberFormat.UInt8LE, 0, VEML6040Register.CONFIG);
                this.configRegisterBuffer.setNumber(NumberFormat.UInt8LE, 1, configValue);
                this.LOG("VEML6040 CONFIG register synced, value: " + configValue.toString());
            }

            public connect(): boolean {
                if (!this.isConnected()) {
                    this.LOG("VEML6040 is not connected on I2C address: " + this.i2cAddr.toString());
                    return false;
                }
                this.syncConfigFromDevice();
                let config = this.configRegisterBuffer.getNumber(NumberFormat.UInt8LE, 1);
                config &= ~VEML6040.bitFieldMap.SHUTDOWN;
                this.configRegisterBuffer.setNumber(NumberFormat.UInt8LE, 0, VEML6040Register.CONFIG);
                this.configRegisterBuffer.setNumber(NumberFormat.UInt8LE, 1, config);
                let success = this.writeRegister(VEML6040Register.CONFIG, this.configRegisterBuffer);
                if (!success) {
                    this.LOG("VEML6040 failed to write CONFIG register, value: " + config.toString());
                }
                return success;
            }

            public disconnect(): boolean {
                let config = this.configRegisterBuffer.getNumber(NumberFormat.UInt8LE, 1);
                config |= VEML6040.bitFieldMap.SHUTDOWN;
                this.configRegisterBuffer.setNumber(NumberFormat.UInt8LE, 0, VEML6040Register.CONFIG);
                this.configRegisterBuffer.setNumber(NumberFormat.UInt8LE, 1, config);
                let success = this.writeRegister(VEML6040Register.CONFIG, this.configRegisterBuffer);
                if (!success) {
                    this.LOG("VEML6040 failed to write CONFIG register, value: " + config.toString());
                }
                return success;
            }

            public setIntegrationTime(integrationTime: VEML6040IntegrationTime): boolean {
                this.integrationTime = integrationTime;
                let config = this.configRegisterBuffer.getNumber(NumberFormat.UInt8LE, 1);
                config = (config & ~0x70) | integrationTime;
                this.configRegisterBuffer.setNumber(NumberFormat.UInt8LE, 0, VEML6040Register.CONFIG);
                this.configRegisterBuffer.setNumber(NumberFormat.UInt8LE, 1, config);
                let success = this.writeRegister(VEML6040Register.CONFIG, this.configRegisterBuffer);
                if (!success) {
                    this.LOG("VEML6040 failed to write CONFIG register, value: " + config.toString());
                }
                return success;
            }

            public setMeasurementMode(mode: VEML6040MeasurementMode): boolean {
                let config = this.configRegisterBuffer.getNumber(NumberFormat.UInt8LE, 1);
                if (mode === VEML6040MeasurementMode.Auto) {
                    config &= ~VEML6040.bitFieldMap.AF;
                } else if (mode === VEML6040MeasurementMode.Manual) {
                    config |= VEML6040.bitFieldMap.AF;
                }
                this.configRegisterBuffer.setNumber(NumberFormat.UInt8LE, 0, VEML6040Register.CONFIG);
                this.configRegisterBuffer.setNumber(NumberFormat.UInt8LE, 1, config);
                let success = this.writeRegister(VEML6040Register.CONFIG, this.configRegisterBuffer);
                if (!success) {
                    this.LOG("VEML6040 failed to write CONFIG register, value: " + config.toString());
                }
                return success;
            }

            public triggerMeasurement(): boolean {
                let config = this.configRegisterBuffer.getNumber(NumberFormat.UInt8LE, 1);
                config |= VEML6040.bitFieldMap.TRIG;
                this.configRegisterBuffer.setNumber(NumberFormat.UInt8LE, 0, VEML6040Register.CONFIG);
                this.configRegisterBuffer.setNumber(NumberFormat.UInt8LE, 1, config);
                let success = this.writeRegister(VEML6040Register.CONFIG, this.configRegisterBuffer);
                if (!success) {
                    this.LOG("VEML6040 failed to write CONFIG register, value: " + config.toString());
                }
                return success;
            }

            public readRed(): number {
                let buffer = this.readRegister(VEML6040Register.R_DATA, 2);
                if (buffer.length != 2) {
                    this.LOG("VEML6040 read R_DATA register failed, expected 2 bytes, got " + buffer.length);
                    return NaN;
                }
                let redValueLow = buffer.getNumber(NumberFormat.UInt8LE, 0);
                let redValueHigh = buffer.getNumber(NumberFormat.UInt8LE, 1);
                let redValue = (redValueHigh << 8) | redValueLow;
                return redValue;
            }

            public readGreen(): number {
                let buffer = this.readRegister(VEML6040Register.G_DATA, 2);
                if (buffer.length != 2) {
                    this.LOG("VEML6040 read G_DATA register failed, expected 2 bytes, got " + buffer.length);
                    return NaN;
                }
                let greenValueLow = buffer.getNumber(NumberFormat.UInt8LE, 0);
                let greenValueHigh = buffer.getNumber(NumberFormat.UInt8LE, 1);
                let greenValue = (greenValueHigh << 8) | greenValueLow;
                return greenValue;
            }

            public readBlue(): number {
                let buffer = this.readRegister(VEML6040Register.B_DATA, 2);
                if (buffer.length != 2) {
                    this.LOG("VEML6040 read B_DATA register failed, expected 2 bytes, got " + buffer.length);
                    return NaN;
                }
                let blueValueLow = buffer.getNumber(NumberFormat.UInt8LE, 0);
                let blueValueHigh = buffer.getNumber(NumberFormat.UInt8LE, 1);
                let blueValue = (blueValueHigh << 8) | blueValueLow;
                return blueValue;
            }

            public readWhite(): number {
                let buffer = this.readRegister(VEML6040Register.W_DATA, 2);
                if (buffer.length != 2) {
                    this.LOG("VEML6040 read W_DATA register failed, expected 2 bytes, got " + buffer.length);
                    return NaN;
                }
                let whiteValueLow = buffer.getNumber(NumberFormat.UInt8LE, 0);
                let whiteValueHigh = buffer.getNumber(NumberFormat.UInt8LE, 1);
                let whiteValue = (whiteValueHigh << 8) | whiteValueLow;
                return whiteValue;
            }

            public readRGBW(): { red: number, green: number, blue: number, white: number } {
                let buffer = this.readRegister(VEML6040Register.R_DATA, 8);
                if (buffer.length != 8) {
                    this.LOG("VEML6040 read RGBW data failed, expected 8 bytes, got " + buffer.length);
                    return { red: NaN, green: NaN, blue: NaN, white: NaN };
                }
                return {
                    red: (buffer.getNumber(NumberFormat.UInt8LE, 1) << 8) | buffer.getNumber(NumberFormat.UInt8LE, 0),
                    green: (buffer.getNumber(NumberFormat.UInt8LE, 3) << 8) | buffer.getNumber(NumberFormat.UInt8LE, 2),
                    blue: (buffer.getNumber(NumberFormat.UInt8LE, 5) << 8) | buffer.getNumber(NumberFormat.UInt8LE, 4),
                    white: (buffer.getNumber(NumberFormat.UInt8LE, 7) << 8) | buffer.getNumber(NumberFormat.UInt8LE, 6),
                };
            }

            public readAmbientLight(): number {
                let g = this.readGreen();
                if (isNaN(g)) {
                    this.LOG("Failed to read green channel, cannot calculate ambient light.");
                    return NaN;
                }
                return g * VEML6040.gSensitivityMap[this.integrationTime];
            }

            public isConnected(): boolean {
                return pins.i2cWriteBuffer(this.i2cAddr, pins.createBuffer(0), false) == 0;
            }

            private writeRegister(register: VEML6040Register, buffer: Buffer): boolean {
                return pins.i2cWriteBuffer(this.i2cAddr, buffer, false) == 0;
            }

            private readRegister(register: VEML6040Register, bytes: number): Buffer {
                let regBuffer = pins.createBuffer(1);
                regBuffer.setNumber(NumberFormat.UInt8LE, 0, register);
                let success = pins.i2cWriteBuffer(this.i2cAddr, regBuffer, true);
                if (!success) {
                    return null;
                }
                let readBuffer = pins.i2cReadBuffer(this.i2cAddr, bytes, false);
                return readBuffer;
            }

        };
    }
}
