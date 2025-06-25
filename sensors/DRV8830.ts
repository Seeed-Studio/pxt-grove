namespace grove {

    export namespace sensors {

        export class DRV8830 {
            private i2cAddr: number;
            private loggingToSerial: boolean;

            public constructor(address: number, loggingToSerial: boolean = false) {
                this.i2cAddr = (address >> 1) & 0x7F;
                this.loggingToSerial = loggingToSerial;
            }

            private LOG(msg: string): void {
                if (this.loggingToSerial) {
                    serial.writeLine(msg);
                }
            }

            public isConnected(): boolean {
                return true;
            }

            public connect(): boolean {
                if (!this.isConnected()) {
                    this.LOG("DRV8830: Not connected");
                    return false;
                }
                this.LOG("DRV8830: Connected");
                return true;
            }

            private write(command: number, value: number): boolean {
                let buf = pins.createBuffer(2);
                buf.setNumber(NumberFormat.UInt8LE, 0, command);
                buf.setNumber(NumberFormat.UInt8LE, 1, value);
                let res = pins.i2cWriteBuffer(this.i2cAddr, buf, false);
                if (res != 0) {
                    this.LOG(`DRV8830: write command ${command} with value ${value} failed`);
                    return false;
                }
                return true;
            }

            private read(command: number, timeout_ms: number): Buffer {
                let buf = pins.createBuffer(1);
                buf.setNumber(NumberFormat.UInt8LE, 0, command);
                const start = control.millis();
                let res = pins.i2cWriteBuffer(this.i2cAddr, buf, false);
                if (res != 0) {
                    this.LOG(`DRV8830: write command ${command} failed`);
                    return null;
                }
                while (control.millis() - start < timeout_ms) {
                    let read_res = pins.i2cReadBuffer(this.i2cAddr, 1, false);
                    if (read_res && read_res.length == 1) {
                        return read_res;
                    }
                    control.waitMicros(1000);
                }
                this.LOG(`DRV8830: read command ${command} timed out after ${timeout_ms} ms`);
                return null;
            }

            public getFault(): number {
                let buf = this.read(0x01, 1000);
                if (!buf || buf.length != 1) {
                    this.LOG("DRV8830: read fault failed");
                    return -1;
                }
                return buf.getNumber(NumberFormat.UInt8LE, 0);
            }

            public clearFault(): boolean {
                return this.write(0x01, 0x80);
            }

            public setSpeed(speed: number): boolean {
                if (speed < -64 || speed > 63) {
                    this.LOG("DRV8830: speed out of range (-64 to 63)");
                    return false;
                }

                if (!this.clearFault()) {
                    this.LOG("DRV8830: clear fault failed before setting speed");
                    return false;
                }

                const val = (speed & 0x3F) << 2 | (speed < 0 ? 0x01 : 0x02);
                if (!this.write(0x00, val)) {
                    this.LOG(`DRV8830: set speed ${speed} failed`);
                    return false;
                }
                return true;
            }

            public setStop(): boolean {
                return this.write(0x00, 0x00);
            }

            public setBrake(): boolean {
                return this.write(0x00, 0x03);
            }

        };

    }

}
