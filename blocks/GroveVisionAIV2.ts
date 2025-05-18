
/**
 * SenseCraft AI support for Grove Vision AI Module V2
 */
//% groups='["Grove Vision AI V2"]'
namespace grove {

    namespace vision_ai_v2 {

        export let transport: grove.plugins.sscma.Transport;
        export let atClient: grove.plugins.sscma.ATClient;

        export let detectionResults: DetectionResult[] = [];
        export let classificationResults: ClassificationResult[] = [];
        export let errorCode: OperationCode = OperationCode.Unknown;

    }


    /**
     * Connect and setup the Grove Vision AI Module V2 through I2C transport
     */
    //% block="connect and setup device, serial logging %serialLogging"
    //% group="Grove Vision AI V2"
    //% weight=100
    //% color="#AA278D"
    export function connectAndSetupGroveVisionAIV2(
        serialLogging: boolean = false,
        i2cAddress: number = 0x62,
        i2cClock: number = 400000,
        force: boolean = false
    ) {
        if (force || !vision_ai_v2.transport) {
            vision_ai_v2.transport = grove.plugins.sscma.Transport.connect(
                i2cAddress,
                i2cClock
            );
        }

        if (force || !vision_ai_v2.atClient) {
            vision_ai_v2.atClient = new grove.plugins.sscma.ATClient(
                vision_ai_v2.transport,
                serialLogging
            );
        } else if (vision_ai_v2.atClient && vision_ai_v2.atClient.getDeviceStatus() === DeviceStatus.Disconnected) {
            vision_ai_v2.atClient.getDeviceStatus();
        }
    }

    /**
     * Get the device status of the Grove Vision AI Module V2
     */
    //% block="get device status"
    //% group="Grove Vision AI V2"
    //% weight=99
    export function getGroveVisionAIV2DeviceStatus(fromCache: boolean = true): DeviceStatus {
        if (vision_ai_v2.atClient) {
            return vision_ai_v2.atClient.getDeviceStatus(fromCache);
        }
        return DeviceStatus.Disconnected;
    }

    /**
     * Get the device name of the Grove Vision AI Module V2
     */
    //% block="get device name"
    //% blockSetVariable=deviceName
    //% group="Grove Vision AI V2"
    //% weight=98
    export function getGroveVisionAIV2DeviceName(fromCache: boolean = true): string {
        if (vision_ai_v2.atClient) {
            return vision_ai_v2.atClient.getDeviceName(fromCache);
        }
        return "";
    }

    /**
     * Get the device ID of the Grove Vision AI Module V2
     */
    //% block="get device id"
    //% blockSetVariable=deviceId
    //% group="Grove Vision AI V2"
    //% weight=97
    export function getGroveVisionAIV2DeviceId(fromCache: boolean = true): string {
        if (vision_ai_v2.atClient) {
            return vision_ai_v2.atClient.getDeviceId(fromCache);
        }
        return "";
    }

    /**
     * Get the AI model info from the Grove Vision AI Module V2
     */
    //% block="get ai model info"
    //% blockSetVariable=modelInfo
    //% group="Grove Vision AI V2"
    //% weight=89
    export function getAIModelInfo(fromCache: boolean = true): ModelInfo {
        if (vision_ai_v2.atClient) {
            return vision_ai_v2.atClient.getModelInfo(fromCache);
        }
        return new ModelInfo("", "", []);
    }

    /**
     * Start AI inference on the Grove Vision AI Module V2
     */
    //% block="start ai inference"
    //% group="Grove Vision AI V2"
    //% weight=79
    //% color="#AA278D"
    export function startAIInference(timeout: number = 1000, force: boolean = true): boolean {
        if (vision_ai_v2.atClient) {
            if (force && vision_ai_v2.atClient.isInference(timeout)) {
                vision_ai_v2.atClient.stopInference(timeout);
            }
            return vision_ai_v2.atClient.startInference(timeout);
        }
        return false;
    }

    let _onDetectionResultsHandler: (detectionResults: DetectionResult[]) => void = null;
    let _onClassificationResultsHandler: (classificationResults: ClassificationResult[]) => void = null;
    let _onErrorHandler: (errorCode: OperationCode) => void = null;

    function _onReceiveDetectionResults(detectionResults: DetectionResult[]) {
        vision_ai_v2.detectionResults = detectionResults;
        if (_onDetectionResultsHandler) {
            _onDetectionResultsHandler(detectionResults);
        }
    }

    function _onReceiveClassificationResults(classificationResults: ClassificationResult[]) {
        vision_ai_v2.classificationResults = classificationResults;
        if (_onClassificationResultsHandler) {
            _onClassificationResultsHandler(classificationResults);
        }
    }

    function _onReceiveError(errorCode: OperationCode) {
        vision_ai_v2.errorCode = errorCode;
        if (_onErrorHandler) {
            _onErrorHandler(errorCode);
        }
    }

    /**
     * Fetch AI inference results from the Grove Vision AI Module V2
     */
    //% block="fetch ai inference results"
    //% group="Grove Vision AI V2"
    //% weight=78
    //% color="#AA278D"
    export function fetchAIInferenceResults(
        maxResults: number = 15,
        timeout: number = 1000,
    ): boolean {
        if (vision_ai_v2.atClient) {
            return vision_ai_v2.atClient.fetchInferenceResult(
                _onReceiveDetectionResults,
                _onReceiveClassificationResults,
                _onReceiveError,
                maxResults,
                timeout
            );
        }
        return false;
    }

    /**
     * Stop AI inference on the Grove Vision AI Module V2
     */
    //% block="stop ai inference"
    //% group="Grove Vision AI V2"
    //% weight=77
    export function stopAIInference(timeout: number = 1000) {
        if (vision_ai_v2.atClient) {
            return vision_ai_v2.atClient.stopInference();
        }
    }

    /**
     * Get total number of specific object id(s)
     */
    //% block
    //% group="Grove Vision AI V2"
    //% weight=69
    export function countObjectById(ids: number[]): number {
        let count = 0;

        for (let detectionResult of vision_ai_v2.detectionResults) {
            for (let id of ids) {
                if (detectionResult.id == id) {
                    ++count;
                }
            }
        }

        for (let classificationResult of vision_ai_v2.classificationResults) {
            for (let id of ids) {
                if (classificationResult.id == id) {
                    ++count;
                }
            }
        }

        return count;
    }

    /**
     * Get total number of specific object name(s)
     */
    //% block
    //% group="Grove Vision AI V2"
    //% weight=68
    export function countObjectByName(labels: string[]): number {
        let count = 0;

        for (let detectionResult of vision_ai_v2.detectionResults) {
            for (let label of labels) {
                if (detectionResult.label == label) {
                    ++count;
                }
            }
        }

        for (let classificationResult of vision_ai_v2.classificationResults) {
            for (let label of labels) {
                if (classificationResult.label == label) {
                    ++count;
                }
            }
        }

        return count;
    }

    /**
     * Check if contains specific object id(s)
     */
    //% block
    //% group="Grove Vision AI V2"
    //% weight=67
    export function containsObjectId(ids: number[]): boolean {
        return countObjectById(ids) > 0;
    }

    /**
     * Check if contains specific object name(s)
     */
    //% block
    //% group="Grove Vision AI V2"
    //% weight=66
    export function containsObjectName(labels: string[]): boolean {
        return countObjectByName(labels) > 0;
    }

    /**
     * Event on receive detection results from the Grove Vision AI Module V2
     */
    //% block="on receive detection results"
    //% group="Grove Vision AI V2"
    //% weight=59
    //% color="#AA278D"
    export function onReceiveDetectionResult(handler: (detectionResults: DetectionResult[]) => void) {
        _onDetectionResultsHandler = handler;
    }

    /**
     * Event on receive classification results from the Grove Vision AI Module V2
     */
    //% block="on receive classification results"
    //% group="Grove Vision AI V2"
    //% weight=58
    //% color="#AA278D"
    export function onReceiveClassificationResult(handler: (classificationResults: ClassificationResult[]) => void) {
        _onClassificationResultsHandler = handler;
    }

    /**
     * Event on receive error from the Grove Vision AI Module V2
     */
    //% block="on receive error"
    //% group="Grove Vision AI V2"
    //% weight=57
    //% color="#AA278D"
    export function onReceiveError(handler: (errorCode: OperationCode) => void) {
        _onErrorHandler = handler;
    }

    /**
     * Get fetched detection results from the Grove Vision AI Module V2
     */
    //% block="get fetched detection results"
    //% blockSetVariable=detectionResults
    //% group="Grove Vision AI V2"
    //% weight=56
    export function getFetchedDetectionResults(): DetectionResult[] {
        return vision_ai_v2.detectionResults;
    }

    /**
     * Get fetched classification results from the Grove Vision AI Module V2
     */
    //% block="get fetched classification results"
    //% blockSetVariable=classificationResults
    //% group="Grove Vision AI V2"
    //% weight=55
    export function getFetchedClassificationResults(): ClassificationResult[] {
        return vision_ai_v2.classificationResults;
    }

    /**
     * Get the AI inference error code from the Grove Vision AI Module V2
     */
    //% block="get inference error code"
    //% blockSetVariable=errorCode
    //% group="Grove Vision AI V2"
    //% weight=54
    export function getAIInferenceErrorCode(fromCache: boolean = true): OperationCode {
        return vision_ai_v2.errorCode;
    }

};
