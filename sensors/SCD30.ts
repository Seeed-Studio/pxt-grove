namespace grove {

    export namespace sensors {

        export class SCD30 {
            private i2cAddr: number;
            private loggingToSerial: boolean;
            private lastSyncTime: number;
            private measurementInterval: number = 2;

            private _co2: number;
            private _temperature: number;
            private _humidity: number;

            public constructor(address: number = 0x61, loggingToSerial: boolean = false) {
                this.i2cAddr = address;
                this.loggingToSerial = loggingToSerial;
                this.lastSyncTime = 0;

                this._co2 = NaN;
                this._temperature = NaN;
                this._humidity = NaN;
            }

            private LOG(msg: string): void {
                if (this.loggingToSerial) {
                    serial.writeLine(msg);
                }
            }

            public isConnected(): boolean {
                let buf = pins.createBuffer(1);
                buf.setNumber(NumberFormat.UInt8LE, 0, 0);
                return pins.i2cWriteBuffer(this.i2cAddr, buf, false) == 0;
            }

            public connect(): boolean {
                if (!this.isConnected()) {
                    this.LOG("SCD30: Not connected");
                    return false;
                }

                return this.setMeasurementInterval(this.measurementInterval) && this.write(0x0010, 0x0000); // Start continuous measurement with default settings
            }

            public disconnect(): boolean {
                if (!this.isConnected()) {
                    this.LOG("SCD30: Not connected");
                    return true;
                }
                let buf = pins.createBuffer(2);
                buf.setNumber(NumberFormat.UInt8LE, 0, 0x01);
                buf.setNumber(NumberFormat.UInt8LE, 1, 0x04);
                let res = pins.i2cWriteBuffer(this.i2cAddr, buf, false);
                if (res != 0) {
                    this.LOG("SCD30: Disconnect failed");
                    return false;
                }
                this.LOG("SCD30: Disconnected");
                return true;
            }

            private crc8(data: Buffer, length: number): number {
                let crc = 0xFF;
                for (let i = 0; i < length; i++) {
                    crc ^= data.getNumber(NumberFormat.UInt8LE, i);
                    for (let j = 0; j < 8; j++) {
                        if (crc & 0x80) {
                            crc = (crc << 1) ^ 0x31;
                        } else {
                            crc <<= 1;
                        }
                    }
                }
                return crc & 0xFF;
            }

            private write(command: number, val: number): boolean {
                let buf = pins.createBuffer(5);
                buf.setNumber(NumberFormat.UInt8LE, 0, command >> 8);
                buf.setNumber(NumberFormat.UInt8LE, 1, command & 0xFF);
                buf.setNumber(NumberFormat.UInt8LE, 2, val >> 8);
                buf.setNumber(NumberFormat.UInt8LE, 3, val & 0xFF);
                buf.setNumber(NumberFormat.UInt8LE, 4, this.crc8(buf, 4));
                let res = pins.i2cWriteBuffer(this.i2cAddr, buf, false);
                if (res != 0) {
                    this.LOG(`SCD30: Write command ${command.toString()} failed`);
                    return false;
                }
                return true;
            }

            public setMeasurementInterval(interval: number): boolean {
                if (interval < 2 || interval > 1800) {
                    this.LOG("SCD30: Invalid measurement interval, must be between 2 and 1800 seconds");
                    return false;
                }
                return this.write(0x4600, interval) && (this.measurementInterval = interval) == interval;
            }

            public setAutoSelfCalibration(enabled: boolean): boolean {
                return this.write(0x5306, enabled ? 1 : 0);
            }

            private read(): boolean {
                {
                    let buf = pins.createBuffer(2);
                    buf.setNumber(NumberFormat.UInt8LE, 0, 0x03);
                    buf.setNumber(NumberFormat.UInt8LE, 1, 0x00);
                    let res = pins.i2cWriteBuffer(this.i2cAddr, buf, false);
                    if (res != 0) {
                        this.LOG("SCD30: Read command failed");
                        return false;
                    }
                }
                let buf = pins.i2cReadBuffer(this.i2cAddr, 18, false);
                if (!buf || buf.length != 18) {
                    this.LOG("SCD30: Read failed, buffer length: " + buf.length.toString());
                    return false;
                }

                let raw = pins.createBuffer(4);
                raw.setNumber(NumberFormat.UInt8LE, 0, buf.getNumber(NumberFormat.UInt8LE, 0));
                raw.setNumber(NumberFormat.UInt8LE, 1, buf.getNumber(NumberFormat.UInt8LE, 1));
                raw.setNumber(NumberFormat.UInt8LE, 2, buf.getNumber(NumberFormat.UInt8LE, 3));
                raw.setNumber(NumberFormat.UInt8LE, 3, buf.getNumber(NumberFormat.UInt8LE, 4));
                this._co2 = raw.getNumber(NumberFormat.Float32BE, 0);

                raw.setNumber(NumberFormat.UInt8LE, 0, buf.getNumber(NumberFormat.UInt8LE, 6));
                raw.setNumber(NumberFormat.UInt8LE, 1, buf.getNumber(NumberFormat.UInt8LE, 7));
                raw.setNumber(NumberFormat.UInt8LE, 2, buf.getNumber(NumberFormat.UInt8LE, 9));
                raw.setNumber(NumberFormat.UInt8LE, 3, buf.getNumber(NumberFormat.UInt8LE, 10));
                this._temperature = raw.getNumber(NumberFormat.Float32BE, 0);

                raw.setNumber(NumberFormat.UInt8LE, 0, buf.getNumber(NumberFormat.UInt8LE, 12));
                raw.setNumber(NumberFormat.UInt8LE, 1, buf.getNumber(NumberFormat.UInt8LE, 13));
                raw.setNumber(NumberFormat.UInt8LE, 2, buf.getNumber(NumberFormat.UInt8LE, 15));
                raw.setNumber(NumberFormat.UInt8LE, 3, buf.getNumber(NumberFormat.UInt8LE, 16));
                this._humidity = raw.getNumber(NumberFormat.Float32BE, 0);

                this.LOG(`SCD30: CO2: ${this._co2.toString()}, Temperature: ${this._temperature.toString()}, Humidity: ${this._humidity.toString()}`);
                return true;
            }

            public readSensorData(forceRead: boolean = false, retryTimes: number = 3, retryDelayMs: number = 2000): boolean {
                if (!forceRead) {
                    const currentTime = input.runningTime();
                    const isInit = isNaN(this._co2) || isNaN(this._humidity) || isNaN(this._temperature);
                    const timeToWait = (isInit ? (this.measurementInterval * 1000) + 2000 : this.measurementInterval * 1000) - (currentTime - this.lastSyncTime);
                    if (timeToWait > 0) {
                        if (!isInit) {
                            this.LOG("Use cached SCD30 data, request new after " + timeToWait + "ms");
                            return true;
                        }
                        this.LOG(`Waiting for ${timeToWait}ms before reading sensor data.`);
                        basic.pause(timeToWait);
                    }
                    this.lastSyncTime = currentTime;
                }

                let retryCount = 0;
                while (true) {
                    if (retryCount > retryTimes) {
                        this.LOG("SCD30 read failed after " + retryCount.toString() + " tries, max " + retryTimes.toString());
                        break;
                    }
                    ++retryCount;

                    if (this.read()) {
                        return true;
                    } else {
                        this.LOG("SCD30 read failed, retrying...");
                        basic.pause(retryDelayMs);
                    }
                }

                return false;
            }

            public get co2(): number {
                return this._co2;
            };

            public get temperature(): number {
                return this._temperature;
            };

            public get humidity(): number {
                return this._humidity;
            };

        };

    }

}
