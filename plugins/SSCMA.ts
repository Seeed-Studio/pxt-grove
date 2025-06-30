/**
 * SenseCraft AI AT backend support by @nullptr, 2025.5.16
 */


//% blockNamespace=grove
//% group="Vision AI V2"
class DetectionResult {
    private _x: number;
    private _y: number;
    private _w: number;
    private _h: number;
    private _score: number;
    private _id: number;
    private _label: string;

    constructor(x: number, y: number, w: number, h: number, score: number, id: number, label: string) {
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;
        this._score = score;
        this._id = id;
        this._label = label;
    }

    //% blockCombine
    get x(): number { return this._x; }

    //% blockCombine
    get y(): number { return this._y; }

    //% blockCombine
    get w(): number { return this._w; }

    //% blockCombine
    get h(): number { return this._h; }

    //% blockCombine
    get score(): number { return this._score; }

    //% blockCombine
    get id(): number { return this._id; }

    //% blockCombine
    get label(): string { return this._label; }

    /**
     * Convert a detection result object to string representation
     * @return A string representation of the detection result
     */
    //% block="convert $this to string"
    //% this.defl=detectionResult
    //% this.shadow=variables_get
    public toString(): string {
        return "xywh=[" + this._x + "," + this._y + "," + this._w + "," + this._h + "] " +
            "score=" + this._score + " " +
            "id=" + this._id + " " +
            "label=" + this._label;
    }
};

//% blockNamespace=grove
//% group="Vision AI V2"
class ClassificationResult {
    private _score: number;
    private _id: number;
    private _label: string;

    constructor(score: number, id: number, label: string) {
        this._score = score;
        this._id = id;
        this._label = label;
    }

    //% blockCombine
    public get score(): number { return this._score; }

    //% blockCombine
    public get id(): number { return this._id; }

    //% blockCombine
    public get label(): string { return this._label; }

    /**
     * Convert a classification result object to string representation
     * @return A string representation of the classification result
     */
    //% block="convert $this to string"
    //% this.defl=classificationResult
    //% this.shadow=variables_get
    public toString(): string {
        return "score=" + this._score + " " +
            "id=" + this._id + " " +
            "label=" + this._label;
    }
};

//% blockNamespace=grove
//% group="Vision AI V2"
//% advanced=true
class ModelInfo {
    private _name: string;
    private _version: string;
    private _labels: string[];

    constructor(name: any, version: any, labels: any) {
        if (typeof name != "string") {
            name = "";
        }
        this._name = name;

        if (typeof version != "string") {
            version = "";
        }
        this._version = version;

        let safeLabels: any[] = [];
        if (labels && typeof labels == "object") {
            safeLabels = labels;
            for (let i = 0; i < safeLabels.length; ++i) {
                if (typeof safeLabels[i] != "string") {
                    safeLabels[i] = "";
                }
            }
        }
        this._labels = safeLabels as string[];
    }

    //% advanced=true
    get name(): string {
        return this._name;
    }

    //% advanced=true
    get version(): string {
        return this._version;
    }

    /**
     * Get the label string by ID, returns empty string if ID is not exist
     * @param id The label ID
     * @return The label string, or empty string if ID is not exist
     */
    //% block="get label by $id"
    //% id.defl=id
    //% id.min=0
    //% id.shadow=variables_get
    //% advanced=true
    public getLabel(id: number): string {
        if (id >= 0 && id < this._labels.length) {
            return this._labels[id];
        }
        return "";
    }
};


namespace grove {

    //% group="Vision AI V2"
    //% advanced=true
    export enum DeviceStatus {
        //% block="Disconnected"
        Disconnected = 0,
        //% block="Busy"
        Busy = 1,
        //% block="Idle"
        Idle = 2,
        //% block="Inferencing"
        Inferencing = 3,
    };

    /**
     * Choose a device status
     * @param status The device status to choose
     * @return The selected device status
     */
    //% block="device status %status"
    //% group="Vision AI V2"
    //% advanced=true
    export function deviceStatus(status: DeviceStatus): DeviceStatus {
        return status;
    }

    //% group="Vision AI V2"
    //% advanced=true
    export enum OperationCode {
        //% block="Success"
        Success = 0,
        //% block="Again"
        Again = 1,
        //% block="Logic Error"
        LogicError = 2,
        //% block="Timeout"
        Timeout = 3,
        //% block="IO Error"
        IOError = 4,
        //% block="Invalid Argument"
        InvalidArgument = 5,
        //% block="Busy"
        Busy = 6,
        //% block="Not Supported"
        NotSupported = 7,
        //% block="Not Permitted"
        NotPermitted = 8,
        //% block="Unknown"
        Unknown = 10
    };

    /**
     * Choose an error code
     * @param code The error code to choose
     * @return The selected error code
     */
    //% block="error code %code"
    //% group="Vision AI V2"
    //% advanced=true
    export function operationCode(code: OperationCode): OperationCode {
        return code;
    }


    export namespace plugins {

        export namespace sscma {


            export class Transport {
                private static startOfFrame = 0x10;

                private static cmdRead = 0x01;
                private static cmdWrite = 0x02;
                private static cmdAvail = 0x03;
                private static cmdStart = 0x04;
                private static cmdStop = 0x05;
                private static cmdReset = 0x06;

                private static i2cAddr: number;
                private static i2cClk: number;

                private static readPktSize: number = 250;
                private static writePktSize: number = 250;

                private static probBuffer: Buffer;
                private static readSofBuffer: Buffer;
                private static writeBuffer: Buffer;
                private static availSofBuffer: Buffer;

                private static instance: Transport;

                private constructor() {
                    if (!Transport.probBuffer) {
                        Transport.probBuffer = pins.createBuffer(1);
                        Transport.probBuffer.setNumber(NumberFormat.UInt8LE, 0, 0);
                    }

                    if (!Transport.readSofBuffer) {
                        Transport.readSofBuffer = pins.createBuffer(6);
                    }
                    Transport.readSofBuffer.fill(0);
                    Transport.readSofBuffer.setNumber(NumberFormat.UInt8LE, 0, Transport.startOfFrame);
                    Transport.readSofBuffer.setNumber(NumberFormat.UInt8LE, 1, Transport.cmdRead);

                    if (!Transport.writeBuffer) {
                        Transport.writeBuffer = pins.createBuffer(Transport.writePktSize + 6);
                    }
                    Transport.writeBuffer.fill(0);
                    Transport.writeBuffer.setNumber(NumberFormat.UInt8LE, 0, Transport.startOfFrame);
                    Transport.writeBuffer.setNumber(NumberFormat.UInt8LE, 1, Transport.cmdWrite);

                    if (!Transport.availSofBuffer) {
                        Transport.availSofBuffer = pins.createBuffer(6);
                    }
                    Transport.availSofBuffer.fill(0);
                    Transport.availSofBuffer.setNumber(NumberFormat.UInt8LE, 0, Transport.startOfFrame);
                    Transport.availSofBuffer.setNumber(NumberFormat.UInt8LE, 1, Transport.cmdAvail);
                }

                public static connect(
                    i2cAddr: number = 0x62,
                    i2cClk: number = 400000
                ): Transport {
                    if (i2cAddr != Transport.i2cAddr || i2cClk != Transport.i2cClk) {
                        Transport.instance = null;
                    }

                    if (!Transport.instance) {
                        Transport.instance = new Transport();

                        Transport.i2cAddr = i2cAddr;
                        Transport.i2cClk = i2cClk;
                    }

                    if (!this.instance.isConnected()) {
                        Transport.instance = null;
                    } else {
                        this.instance.cleanup();
                    }

                    return Transport.instance;
                }

                public static disconnect(): void {
                    if (Transport.instance) {
                        Transport.instance = null;
                    }
                }

                public read(buf: Buffer, size: number, syncDelay: number = 2): number {
                    const packets = Math.floor(size / Transport.readPktSize);
                    const remain = size % Transport.readPktSize;

                    let sizeHigh = (Transport.readPktSize >> 8) & 0xFF;
                    let sizeLow = Transport.readPktSize & 0xFF;

                    Transport.readSofBuffer.setNumber(NumberFormat.UInt8LE, 2, sizeHigh);
                    Transport.readSofBuffer.setNumber(NumberFormat.UInt8LE, 3, sizeLow);

                    let offset = 0;
                    let ret = 0;

                    for (let i = 0; i < packets; ++i) {
                        ret = pins.i2cWriteBuffer(
                            Transport.i2cAddr,
                            Transport.readSofBuffer,
                            false
                        );
                        if (ret == 0) {
                            basic.pause(syncDelay);

                            let buffer = pins.i2cReadBuffer(
                                Transport.i2cAddr,
                                Transport.readPktSize,
                                false
                            );

                            let end = offset + buffer.length;
                            buf.write(offset, buffer);
                            offset = end;
                        }
                    }

                    if (remain == 0) {
                        return offset;
                    }

                    sizeHigh = (remain >> 8) & 0xFF;
                    sizeLow = remain & 0xFF;

                    Transport.readSofBuffer.setNumber(NumberFormat.UInt8LE, 2, sizeHigh);
                    Transport.readSofBuffer.setNumber(NumberFormat.UInt8LE, 3, sizeLow);

                    ret = pins.i2cWriteBuffer(
                        Transport.i2cAddr,
                        Transport.readSofBuffer,
                        false
                    );
                    if (ret == 0) {
                        basic.pause(syncDelay);

                        let buffer = pins.i2cReadBuffer(
                            Transport.i2cAddr,
                            remain,
                            false
                        );

                        let end = offset + buffer.length;
                        buf.write(offset, buffer);
                        offset = end;
                    }

                    return offset;
                }

                public write(data: Buffer, size: number, syncDelay: number = 2): number {
                    const packets = Math.floor(size / Transport.writePktSize);
                    const remain = size % Transport.writePktSize;

                    let sizeHigh = (Transport.writePktSize >> 8) & 0xFF;
                    let sizeLow = Transport.writePktSize & 0xFF;

                    Transport.writeBuffer.setNumber(NumberFormat.UInt8LE, 2, sizeHigh);
                    Transport.writeBuffer.setNumber(NumberFormat.UInt8LE, 3, sizeLow);

                    let offset = 0;
                    let ret = 0;

                    for (let i = 0; i < packets; ++i) {
                        const end = offset + Transport.writePktSize;
                        const chunk = data.slice(offset, end);

                        Transport.writeBuffer.write(4, chunk);
                        ret = pins.i2cWriteBuffer(
                            Transport.i2cAddr,
                            Transport.writeBuffer,
                            false
                        );
                        if (ret != 0) {
                            return offset;
                        }

                        offset = end;

                        basic.pause(syncDelay);
                    }

                    if (remain == 0) {
                        return offset;
                    }

                    sizeHigh = (remain >> 8) & 0xFF;
                    sizeLow = remain & 0xFF;

                    Transport.writeBuffer.setNumber(NumberFormat.UInt8LE, 2, sizeHigh);
                    Transport.writeBuffer.setNumber(NumberFormat.UInt8LE, 3, sizeLow);

                    const end = offset + remain;
                    const chunk = data.slice(offset, end);
                    Transport.writeBuffer.write(4, chunk);
                    Transport.writeBuffer.setNumber(NumberFormat.UInt8LE, 4 + end, 0x00);
                    Transport.writeBuffer.setNumber(NumberFormat.UInt8LE, 5 + end, 0x00);

                    const buffer = Transport.writeBuffer.slice(0, 6 + end);
                    ret = pins.i2cWriteBuffer(
                        Transport.i2cAddr,
                        buffer,
                        false
                    );
                    if (ret != 0) {
                        return offset;
                    }

                    offset = end;

                    basic.pause(syncDelay);

                    return offset;
                }

                public avail(syncDelay: number = 2): number {
                    let ret = pins.i2cWriteBuffer(
                        Transport.i2cAddr,
                        Transport.availSofBuffer,
                        false
                    );
                    if (ret != 0) {
                        return 0;
                    }

                    basic.pause(syncDelay);

                    let buffer = pins.i2cReadBuffer(
                        Transport.i2cAddr,
                        2,
                        false
                    );
                    if (buffer.length != 2) {
                        return 0;
                    }

                    let sizeHigh = buffer.getNumber(NumberFormat.UInt8LE, 0);
                    let sizeLow = buffer.getNumber(NumberFormat.UInt8LE, 1);

                    return (sizeHigh << 8) | sizeLow;
                }

                public cleanup(
                    skipIfAvail: number = 0,
                    repeatIfAvail: number = 65535,
                    stepSize: number = 4096,
                ): void {
                    if (skipIfAvail < 0) {
                        skipIfAvail = 0;
                    }
                    if (stepSize <= 0) {
                        return;
                    }

                    let buffer = pins.createBuffer(stepSize);
                    let avail = this.avail();
                    while (avail > skipIfAvail) {
                        while (avail > 0) {
                            const len = this.read(buffer, Math.min(avail, stepSize));
                            if (len <= 0) {
                                break;
                            }
                            avail -= len;
                        }
                        avail = this.avail();
                    }
                }

                public isConnected(): boolean {
                    let status = pins.i2cWriteBuffer(
                        Transport.i2cAddr,
                        Transport.probBuffer,
                        false
                    );

                    return status == 0;
                }
            };


            enum ResponseType {
                Direct = 0,
                Event = 1,
                System = 2,
            };


            function decodeBase64(encoded: string): string {
                if (encoded && encoded.length <= 0 && encoded.length % 4 != 0) {
                    return "";
                }

                const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
                const base64Map: { [key: string]: number } = {};
                for (let i = 0; i < base64Chars.length; ++i) {
                    base64Map[base64Chars[i]] = i;
                }

                let decoded = "";
                for (let i = 0; i < encoded.length;) {
                    const b1 = base64Map[encoded[i++]];
                    const b2 = base64Map[encoded[i++]];
                    const b3 = base64Map[encoded[i++]];
                    const b4 = base64Map[encoded[i++]];

                    if (b1 == undefined || b2 == undefined || b3 == undefined || b4 == undefined) {
                        return "";
                    }

                    const d1 = (b1 << 2) | (b2 >> 4);
                    const d2 = ((b2 & 0x0F) << 4) | (b3 >> 2);
                    const d3 = ((b3 & 0x03) << 6) | b4;
                    decoded += String.fromCharCode(d1);
                    if (b3 ^ 64) {
                        decoded += String.fromCharCode(d2);
                    }
                    if (b4 ^ 64) {
                        decoded += String.fromCharCode(d3);
                    }
                }

                return decoded;
            };


            export class ATClient {

                private transport: Transport;
                private deviceStatus: DeviceStatus = DeviceStatus.Disconnected;

                private commandPrefix: string = "AT+";
                private commandSuffix: string = "\r\n";

                private responseSof: string = "\r";
                private responseEof: string = "\n";

                private cachedDeviceId: string = "";
                private cachedDeviceName: string = "";
                private cachedModelInfo: ModelInfo = new ModelInfo("", "", []);

                private responseQueueLimit: number;
                private responseQueue: Array<any> = [];

                private loggingToSerial: boolean;

                private maxRetry: number;
                private retryTimeout: number;
                private retryDelay: number;

                constructor(
                    transport: Transport,
                    loggingToSerial: boolean = false,
                    responseQueueLimit: number = 10,
                    maxRetry: number = 3,
                    retryTimeout: number = 1000,
                    retryDelay: number = 100,

                ) {
                    this.transport = transport;
                    if (!this.transport) {
                        return this;
                    }

                    this.loggingToSerial = loggingToSerial;

                    this.responseQueueLimit = responseQueueLimit;
                    if (this.responseQueueLimit <= 0) {
                        this.LOG("Invalid response queue limit: " + responseQueueLimit + ", using default value of 10.");
                        this.responseQueueLimit = 10;
                    }

                    this.deviceStatus = DeviceStatus.Busy;
                    this.transport.cleanup();

                    if (maxRetry <= 0) {
                        this.LOG("Invalid max retry value: " + maxRetry + ", using default value of 3.");
                        maxRetry = 3;
                    }
                    this.maxRetry = maxRetry;
                    if (retryTimeout <= 0) {
                        this.LOG("Invalid retry timeout value: " + retryTimeout + ", using default value of 1000 ms.");
                        retryTimeout = 1000;
                    }
                    this.retryTimeout = retryTimeout;
                    if (retryDelay <= 0) {
                        this.LOG("Invalid retry delay value: " + retryDelay + ", using default value of 100 ms.");
                        retryDelay = 100;
                    }
                    this.retryDelay = retryDelay;

                    this.updateDeviceStatus();
                    if (this.deviceStatus < DeviceStatus.Idle) {
                        this.LOG("Failed to initialize device, please check the connection.");
                    }
                }

                private LOG(msg: string): void {
                    if (this.loggingToSerial) {
                        serial.writeLine(msg);
                    }
                }

                private waitResponse(
                    responseType: ResponseType,
                    responseName: string,
                    discardStaled: boolean,
                    fetchDelay: number,
                    timeout: number = 1000
                ): any {
                    if (timeout <= 0) {
                        this.LOG("Invalid timeout value: " + timeout + ", using default value of 1000 ms.");
                        timeout = 1000;
                    }

                    let startTime = input.runningTime();
                    let endTime = startTime + timeout;

                    while (input.runningTime() < endTime) {
                        let responseIdxs: number[] = [];
                        for (let i = 0; i < this.responseQueue.length; ++i) {
                            let response = this.responseQueue[i];
                            if (response["type"] == responseType && response["name"] == responseName) {
                                if (!discardStaled) {
                                    this.responseQueue.splice(i, 1);
                                    return response;
                                }
                                responseIdxs.push(i - responseIdxs.length);
                            }
                        }
                        if (responseIdxs.length > 0) {
                            while (responseIdxs.length > 1) {
                                let idx = responseIdxs.shift();
                                this.responseQueue.splice(idx, 1);
                            }
                            const idx = responseIdxs[0];
                            const response = this.responseQueue[idx];
                            this.responseQueue.splice(idx, 1);
                            return response;
                        }

                        let responseCount = this.fetchResponse();
                        if (responseCount == 0) {
                            basic.pause(fetchDelay);
                        }
                    }

                    return null;
                }

                private fetchResponse(): number {
                    const avail = this.transport.avail();
                    if (avail <= 0) {
                        return 0;
                    }

                    let buffer = pins.createBuffer(avail);
                    const size = this.transport.read(buffer, avail);

                    if (size <= 0) {
                        this.LOG("Failed to read data from transport.");
                        return 0;
                    } else if (size != avail) {
                        this.LOG("Potential data loss, expected " + avail + " bytes but received " + size + " bytes.");
                    }

                    let start = 0;
                    let end = 0;
                    let responseCount = 0;

                    for (let i = 0; i < size; ++i) {
                        const ch = buffer.getNumber(NumberFormat.UInt8LE, i);

                        if (ch == this.responseSof.charCodeAt(0)) {
                            start = i + 1;
                        } else if (ch == this.responseEof.charCodeAt(0)) {
                            end = i;

                            const response = buffer.slice(start, end);
                            const responseStr = response.toString();

                            const responseObj = JSON.parse(responseStr);
                            if (responseObj && typeof responseObj == "object") {
                                while (this.responseQueue.length > this.responseQueueLimit) {
                                    this.responseQueue.shift();
                                }
                                this.responseQueue.push(responseObj);
                                ++responseCount;
                            } else {
                                this.LOG("Failed to parse response: " + responseStr);
                            }
                            start = end + 1;
                        }
                    }

                    return responseCount;
                }

                private updateDeviceStatus(): void {
                    if (!this.transport.isConnected()) {
                        this.deviceStatus = DeviceStatus.Disconnected;
                        return;
                    }

                    let maxRetry = this.maxRetry;
                    while (maxRetry >= 0) {
                        this.getDeviceId(false, this.retryTimeout);
                        this.getDeviceName(false, this.retryTimeout);
                        if (this.cachedDeviceId.length > 0 && this.cachedDeviceName.length > 0) {
                            this.deviceStatus = DeviceStatus.Idle;
                            return;
                        }
                        --maxRetry;
                        basic.pause(this.retryDelay);
                    }

                    this.deviceStatus = DeviceStatus.Busy;
                }

                public getDeviceStatus(fromCache: boolean = false): DeviceStatus {
                    if (!fromCache) {
                        this.updateDeviceStatus();
                        this.isInference();
                    }
                    return this.deviceStatus;
                }

                public getDeviceId(fromCache: boolean = true, timeout: number = 1000, cleanupIf: number = 0): string {
                    if (this.deviceStatus == DeviceStatus.Disconnected) {
                        return "";
                    }

                    if (fromCache && this.cachedDeviceId.length > 0) {
                        return this.cachedDeviceId;
                    }

                    this.transport.cleanup(cleanupIf);

                    const cmdName = "ID?";
                    const cmd = this.commandPrefix + cmdName + this.commandSuffix;
                    const data = pins.createBuffer(cmd.length);
                    for (let i = 0; i < cmd.length; ++i) {
                        data.setNumber(NumberFormat.UInt8LE, i, cmd.charCodeAt(i));
                    }
                    const size = this.transport.write(data, data.length);
                    if (size != data.length) {
                        this.LOG("Failed to request device ID.");
                        return "";
                    }

                    const response = this.waitResponse(ResponseType.Direct, cmdName, false, 30, timeout);
                    if (response && response["code"] == OperationCode.Success) {
                        const deviceId = response["data"];
                        if (typeof deviceId == "string") {
                            this.cachedDeviceId = deviceId;
                            return this.cachedDeviceId;
                        }
                        this.LOG("Invalid device ID format: " + typeof deviceId);
                    }
                    this.LOG("Failed to parse response.");

                    return "";
                }

                public getDeviceName(fromCache: boolean = true, timeout: number = 1000, cleanupIf: number = 0): string {
                    if (this.deviceStatus == DeviceStatus.Disconnected) {
                        return "";
                    }

                    if (fromCache && this.cachedDeviceName.length > 0) {
                        return this.cachedDeviceName;
                    }

                    this.transport.cleanup(cleanupIf);

                    const cmdName = "NAME?";
                    const cmd = this.commandPrefix + cmdName + this.commandSuffix;
                    const data = pins.createBuffer(cmd.length);
                    for (let i = 0; i < cmd.length; ++i) {
                        data.setNumber(NumberFormat.UInt8LE, i, cmd.charCodeAt(i));
                    }
                    const size = this.transport.write(data, data.length);
                    if (size != data.length) {
                        this.LOG("Failed to request device name.");
                        return "";
                    }

                    const response = this.waitResponse(ResponseType.Direct, cmdName, false, 30, timeout);
                    if (response && response["code"] == OperationCode.Success) {
                        const deviceName = response["data"];
                        if (typeof deviceName == "string") {
                            this.cachedDeviceName = deviceName;
                            return this.cachedDeviceName;
                        }
                        this.LOG("Invalid device name format: " + typeof deviceName);
                    }
                    this.LOG("Failed to parse response.");

                    return "";
                }

                public getModelInfo(fromCache: boolean = true, timeout: number = 1000, cleanupIf: number = 0): ModelInfo {
                    if (this.deviceStatus == DeviceStatus.Disconnected) {
                        return new ModelInfo("", "", []);
                    }

                    if (fromCache && this.cachedModelInfo.name.length > 0) {
                        return this.cachedModelInfo;
                    }

                    this.transport.cleanup(cleanupIf);

                    const cmdName = "INFO?";
                    const cmd = this.commandPrefix + cmdName + this.commandSuffix;
                    const data = pins.createBuffer(cmd.length);
                    for (let i = 0; i < cmd.length; ++i) {
                        data.setNumber(NumberFormat.UInt8LE, i, cmd.charCodeAt(i));
                    }
                    const size = this.transport.write(data, data.length);
                    if (size != data.length) {
                        this.LOG("Failed to request model info.");
                        return this.cachedModelInfo;
                    }
                    const response = this.waitResponse(ResponseType.Direct, cmdName, false, 30, timeout);
                    if (!response || response["code"] != OperationCode.Success) {
                        this.LOG("Failed to get model info: " + response["code"]);
                        return this.cachedModelInfo;
                    }
                    const modelObj = response["data"];
                    if (!modelObj || typeof modelObj != "object") {
                        this.LOG("Invalid model info format: " + typeof modelObj);
                        return new ModelInfo("", "", []);
                    }
                    const encodedModelInfo = modelObj["info"];
                    if (typeof encodedModelInfo != "string") {
                        this.LOG("Invalid model info format: " + typeof encodedModelInfo);
                        return new ModelInfo("", "", []);
                    }
                    const decodedModelInfo = decodeBase64(encodedModelInfo);
                    if (!decodedModelInfo || decodedModelInfo.length <= 0) {
                        this.LOG("Failed to decode model info: " + encodedModelInfo);
                        return new ModelInfo("", "", []);
                    }
                    const fullModelInfo = JSON.parse(decodedModelInfo);
                    if (fullModelInfo && typeof fullModelInfo == "object") {
                        this.cachedModelInfo = new ModelInfo(
                            fullModelInfo["model_name"],
                            fullModelInfo["version"],
                            fullModelInfo["classes"]
                        );
                        return this.cachedModelInfo;
                    }
                    this.LOG("Failed to parse model info.");

                    return new ModelInfo("", "", []);
                }

                public isInference(timeout: number = 1000, cleanupIf: number = 0): boolean {
                    if (this.deviceStatus == DeviceStatus.Disconnected) {
                        return false;
                    }

                    this.transport.cleanup(cleanupIf);

                    const cmdName = "INVOKE?";
                    const cmd = this.commandPrefix + cmdName + this.commandSuffix;
                    const data = pins.createBuffer(cmd.length);
                    for (let i = 0; i < cmd.length; ++i) {
                        data.setNumber(NumberFormat.UInt8LE, i, cmd.charCodeAt(i));
                    }
                    const size = this.transport.write(data, data.length);
                    if (size != data.length) {
                        this.LOG("Failed to request inference status.");
                        return false;
                    }
                    const response = this.waitResponse(ResponseType.Direct, cmdName, false, 30, timeout);
                    if (response && response["code"] == OperationCode.Success) {
                        const inferenceStatus = response["data"];
                        if (typeof inferenceStatus == "number") {
                            this.deviceStatus = inferenceStatus == 1 ? DeviceStatus.Inferencing : DeviceStatus.Idle;
                            return this.deviceStatus == DeviceStatus.Inferencing;
                        }
                        this.LOG("Invalid inference status format: " + typeof inferenceStatus);
                    }

                    return false;
                }

                public startInference(timeout: number = 1000, cleanupIf: number = 0): boolean {
                    if (this.deviceStatus == DeviceStatus.Disconnected) {
                        return false;
                    }

                    this.getModelInfo(true, timeout, cleanupIf);

                    this.transport.cleanup(cleanupIf);

                    const cmdName = "INVOKE";
                    const cmdArgs = "=-1,0,1";
                    const cmd = this.commandPrefix + cmdName + cmdArgs + this.commandSuffix;
                    const data = pins.createBuffer(cmd.length);
                    for (let i = 0; i < cmd.length; ++i) {
                        data.setNumber(NumberFormat.UInt8LE, i, cmd.charCodeAt(i));
                    }
                    const size = this.transport.write(data, data.length);
                    if (size != data.length) {
                        this.LOG("Failed to request inference start.");
                        return false;
                    }
                    const response = this.waitResponse(ResponseType.Direct, cmdName, false, 30, timeout);
                    if (!response) {
                        this.LOG("Failed to get inference start response.");
                        return false;
                    }
                    if (response["code"] == OperationCode.Success) {
                        this.deviceStatus = DeviceStatus.Inferencing;
                        return true;
                    } else {
                        this.LOG("Failed to start inference: " + response["code"]);
                    }

                    return false;
                }

                public stopInference(timeout: number = 1000): void {
                    if (this.deviceStatus == DeviceStatus.Disconnected) {
                        return;
                    }

                    this.transport.cleanup();

                    const cmdName = "BREAK";
                    const cmd = this.commandPrefix + cmdName + this.commandSuffix;
                    const data = pins.createBuffer(cmd.length);
                    for (let i = 0; i < cmd.length; ++i) {
                        data.setNumber(NumberFormat.UInt8LE, i, cmd.charCodeAt(i));
                    }
                    const size = this.transport.write(data, data.length);
                    if (size != data.length) {
                        this.LOG("Failed to request inference stop.");
                        return;
                    }
                    const response = this.waitResponse(ResponseType.Direct, cmdName, false, 30, timeout);
                    if (response && response["code"] == OperationCode.Success) {
                        this.deviceStatus = DeviceStatus.Idle;
                        return;
                    }
                    this.LOG("Failed to stop inference.");
                }

                public fetchInferenceResult(
                    onDetection: (results: DetectionResult[]) => void = null,
                    onClassification: (results: ClassificationResult[]) => void = null,
                    onError: (code: number) => void = null,
                    maxResults: number = 15,
                    timeout: number = 1000,
                    cleanupIf: number = 0,
                ): boolean {
                    if (this.deviceStatus == DeviceStatus.Disconnected) {
                        return false;
                    }
                    if (this.deviceStatus != DeviceStatus.Inferencing) {
                        return false;
                    }

                    this.transport.cleanup(cleanupIf);

                    const event = this.waitResponse(ResponseType.Event, "INVOKE", true, 30, timeout);
                    if (!event) {
                        this.LOG("Failed to get inference result.");
                        if (onError) {
                            onError(OperationCode.Timeout);
                        }
                        return false;
                    }

                    if (event["code"] != OperationCode.Success) {
                        this.LOG("Inference error: " + event["code"]);
                        if (onError) {
                            onError(event["code"]);
                        }
                        this.deviceStatus = DeviceStatus.Idle;
                        return false;
                    }

                    const result = event["data"];
                    if (!result || typeof result != "object") {
                        this.LOG("Invalid inference result format: " + typeof result);
                        if (onError) {
                            onError(OperationCode.Again);
                        }
                        return false;
                    }

                    let resolution: number[];
                    const unsafeResolution: any[] = result["resolution"];
                    if (unsafeResolution &&
                        typeof unsafeResolution == "object" &&
                        unsafeResolution.length >= 2 &&
                        typeof unsafeResolution[0] == "number" &&
                        typeof unsafeResolution[1] == "number"
                    ) {
                        resolution = unsafeResolution as number[];
                    } else {
                        this.LOG("Invalid resolution format: " + typeof result["resolution"]);
                        if (onError) {
                            onError(OperationCode.Unknown);
                        }
                        return false;
                    }

                    if (onDetection) {
                        let detections: DetectionResult[] = [];
                        const unsafeDetections: any[] = result["boxes"];
                        if (unsafeDetections && typeof unsafeDetections == "object") {
                            const maxDetections = Math.min(unsafeDetections.length, maxResults);
                            for (let i = 0; i < maxDetections; ++i) {
                                const unsafeDetection: any[] = unsafeDetections[i];
                                if (!unsafeDetection || unsafeDetection.length < 6) {
                                    continue;
                                }
                                let badResult = false;
                                for (let j = 0; j < 6; ++j) {
                                    const value = unsafeDetection[j];
                                    if (typeof value != "number") {
                                        badResult = true;
                                        break;
                                    }
                                }
                                if (badResult) {
                                    continue;
                                }
                                const x = unsafeDetection[0] / resolution[0];
                                const y = unsafeDetection[1] / resolution[1];
                                const w = unsafeDetection[2] / resolution[0];
                                const h = unsafeDetection[3] / resolution[1];
                                const score = unsafeDetection[4];
                                const id = unsafeDetection[5];
                                const label = this.cachedModelInfo.getLabel(id);

                                detections.push(new DetectionResult(x, y, w, h, score, id, label));
                            }
                        }

                        detections.sort((a, b) => {
                            return b.score - a.score;
                        });
                        onDetection(detections);
                    }

                    if (onClassification) {
                        let classifications: ClassificationResult[] = [];
                        const unsafeClassifications: any[] = result["classes"];
                        if (unsafeClassifications && typeof unsafeClassifications == "object") {
                            const maxClassifications = Math.min(unsafeClassifications.length, maxResults);
                            for (let i = 0; i < maxClassifications; ++i) {
                                const unsafeClassification: any[] = unsafeClassifications[i];
                                if (!unsafeClassification || unsafeClassification.length < 2) {
                                    continue;
                                }
                                let badResult = false;
                                for (let j = 0; j < 2; ++j) {
                                    const value = unsafeClassification[j];
                                    if (typeof value != "number") {
                                        badResult = true;
                                        break;
                                    }
                                }
                                if (badResult) {
                                    continue;
                                }
                                const score = unsafeClassification[0];
                                const id = unsafeClassification[1];
                                const label = this.cachedModelInfo.getLabel(id);

                                classifications.push(new ClassificationResult(score, id, label));
                            }
                        }

                        classifications.sort((a, b) => {
                            return b.score - a.score;
                        });
                        onClassification(classifications);
                    }

                    return true;
                }
            };


        }

    }

}
