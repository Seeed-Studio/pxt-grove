namespace grove {

    export namespace sensors {

        export class SCD41 {
            private i2cAddr: number;
            private loggingToSerial: boolean;
            private lastSyncTime: number;
            private measurementInterval: number = 5;

            private _co2: number;
            private _temperature: number;
            private _humidity: number;

            public constructor(address: number = 0x62, loggingToSerial: boolean = false) {
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
                    this.LOG("SCD41: Not connected");
                    return false;
                }

                control.waitMicros(30000);

                return this.write(0x36f6, 0x0000, 2, 30) && this.write(0x3f86, 0x0000, 2, 500) && this.write(0x3646, 0x0000, 2, 30) &&
                    this.write(0x21b1, 0x0000, 2);
            }

            public disconnect(): boolean {
                if (!this.isConnected()) {
                    this.LOG("SCD41: Not connected");
                    return true;
                }
                return this.write(0x3f86, 0x0000, 2, 500) && this.write(0x36e0, 0x0000, 2, 1);
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

            private write(command: number, val: number, size: number, delay_ms: number = 0): boolean {
                let res = -1;
                if (size == 2) {
                    let buf = pins.createBuffer(2);
                    buf.setNumber(NumberFormat.UInt8LE, 0, command >> 8);
                    buf.setNumber(NumberFormat.UInt8LE, 1, command & 0xFF);
                    res = pins.i2cWriteBuffer(this.i2cAddr, buf, false);
                } else if (size == 5) {
                    let buf = pins.createBuffer(5);
                    buf.setNumber(NumberFormat.UInt8LE, 0, command >> 8);
                    buf.setNumber(NumberFormat.UInt8LE, 1, command & 0xFF);
                    buf.setNumber(NumberFormat.UInt8LE, 2, val >> 8);
                    buf.setNumber(NumberFormat.UInt8LE, 3, val & 0xFF);
                    buf.setNumber(NumberFormat.UInt8LE, 4, this.crc8(buf, 4));
                    res = pins.i2cWriteBuffer(this.i2cAddr, buf, false);
                }
                if (res != 0) {
                    this.LOG(`SCD41: Write command ${command.toString()} failed, size: ${size.toString()}`);
                    return false;
                }
                if (delay_ms > 0) {
                    control.waitMicros(delay_ms * 1000);
                }
                return true;
            }

            public setAutoSelfCalibration(enabled: boolean): boolean {
                return this.write(0x2416, enabled ? 1 : 0, 5, 1);
            }

            private wait(timeout_ms: number): boolean {
                const start = control.millis();
                while (true) {
                    if (control.millis() - start > timeout_ms) {
                        this.LOG("SCD41: wait timeout");
                        return false;
                    }

                    if (!this.write(0xe4b8, 0x0000, 2, 1)) {
                        this.LOG("SCD41: wait write failed");
                        return false;
                    }
                    let buf = pins.i2cReadBuffer(this.i2cAddr, 3, false);
                    if (!buf || buf.length != 3) {
                        this.LOG("SCD41: wait read failed, buffer length: " + buf.length.toString());
                        return false;
                    }
                    const crc = this.crc8(buf, 2);
                    if (crc != buf.getNumber(NumberFormat.UInt8LE, 2)) {
                        this.LOG("SCD41: wait CRC error, expected: " + crc.toString() + ", got: " + buf.getNumber(NumberFormat.UInt8LE, 2).toString());
                        return false;
                    }
                    let data_ready = (buf.getNumber(NumberFormat.UInt8LE, 0) << 8) | buf.getNumber(NumberFormat.UInt8LE, 1);
                    if ((data_ready & 2047) != 0) {
                        this.LOG("SCD41: data ready");
                        return true;
                    }
                    control.waitMicros(100000);
                }
            }

            private read(): boolean {
                if (!this.wait(5000)) {
                    this.LOG("SCD41: wait for data ready failed");
                    return false;
                }

                if (!this.write(0xec05, 0x0000, 2, 1)) {
                    this.LOG("SCD41: read command failed");
                    return false;
                }

                let buf = pins.i2cReadBuffer(this.i2cAddr, 9, false);
                if (!buf || buf.length != 9) {
                    this.LOG("SCD41: read failed, buffer length: " + buf.length.toString());
                    return false;
                }
                let raw = buf.slice(0, 2);
                let crc = buf.getNumber(NumberFormat.UInt8LE, 2);
                if (this.crc8(raw, 2) != crc) {
                    this.LOG("SCD41: read CO2 CRC error, expected: " + this.crc8(raw, 2).toString() + ", got: " + crc.toString());
                    return false;
                }
                this._co2 = (raw.getNumber(NumberFormat.UInt8LE, 0) << 8) | raw.getNumber(NumberFormat.UInt8LE, 1);

                raw = buf.slice(3, 2);
                crc = buf.getNumber(NumberFormat.UInt8LE, 5);
                if (this.crc8(raw, 2) != crc) {
                    this.LOG("SCD41: read temperature CRC error, expected: " + this.crc8(raw, 2).toString() + ", got: " + crc.toString());
                    return false;
                }
                this._temperature = (((raw.getNumber(NumberFormat.UInt8LE, 0) << 8) | raw.getNumber(NumberFormat.UInt8LE, 1)) * 175.0 / 65535.0) - 45.0;

                raw = buf.slice(6, 2);
                crc = buf.getNumber(NumberFormat.UInt8LE, 8);
                if (this.crc8(raw, 2) != crc) {
                    this.LOG("SCD41: read humidity CRC error, expected: " + this.crc8(raw, 2).toString() + ", got: " + crc.toString());
                    return false;
                }
                this._humidity = ((raw.getNumber(NumberFormat.UInt8LE, 0) << 8) | raw.getNumber(NumberFormat.UInt8LE, 1)) * 100.0 / 65535.0;

                this.LOG(`SCD41: CO2: ${this._co2.toString()}, Temperature: ${this._temperature.toString()}, Humidity: ${this._humidity.toString()}`);

                return true;
            }

            public readSensorData(forceRead: boolean = false, retryTimes: number = 3, retryDelayMs: number = 2000): boolean {
                if (!forceRead) {
                    const currentTime = input.runningTime();
                    const isInit = isNaN(this._co2) || isNaN(this._humidity) || isNaN(this._temperature);
                    const timeToWait = (isInit ? (this.measurementInterval * 1000) + 2000 : this.measurementInterval * 1000) - (currentTime - this.lastSyncTime);
                    if (timeToWait > 0) {
                        if (!isInit) {
                            this.LOG("Use cached SCD41 data, request new after " + timeToWait + "ms");
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
                        this.LOG("SCD41 read failed after " + retryCount.toString() + " tries, max " + retryTimes.toString());
                        break;
                    }
                    ++retryCount;

                    if (this.read()) {
                        return true;
                    } else {
                        this.LOG("SCD41 read failed, retrying...");
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
