
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
     * @param serialLogging Enable serial logging for debugging
     * @param i2cAddress The I2C address of the Grove Vision AI Module V2
     * @param i2cClock The I2C clock speed, default is 400kHz
     * @param force Force re-connection and setup even if already connected
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
     * @param fromCache Use cached status if available, default is true
     * @return The current device status
     */
    //% block="get device status"
    //% group="Grove Vision AI V2"
    //% advanced=true
    //% weight=99
    export function getGroveVisionAIV2DeviceStatus(fromCache: boolean = true): DeviceStatus {
        if (vision_ai_v2.atClient) {
            return vision_ai_v2.atClient.getDeviceStatus(fromCache);
        }
        return DeviceStatus.Disconnected;
    }

    /**
     * Get the device name of the Grove Vision AI Module V2
     * @param fromCache Use cached name if available, default is true
     * @return The device name as a string
     */
    //% block="get device name"
    //% blockSetVariable=deviceName
    //% group="Grove Vision AI V2"
    //% advanced=true
    //% weight=98
    export function getGroveVisionAIV2DeviceName(fromCache: boolean = true): string {
        if (vision_ai_v2.atClient) {
            return vision_ai_v2.atClient.getDeviceName(fromCache);
        }
        return "";
    }

    /**
     * Get the device ID of the Grove Vision AI Module V2
     * @param fromCache Use cached ID if available, default is true
     * @return The device ID as a string
     */
    //% block="get device id"
    //% blockSetVariable=deviceId
    //% group="Grove Vision AI V2"
    //% advanced=true
    //% weight=97
    export function getGroveVisionAIV2DeviceId(fromCache: boolean = true): string {
        if (vision_ai_v2.atClient) {
            return vision_ai_v2.atClient.getDeviceId(fromCache);
        }
        return "";
    }

    /**
     * Get the AI model info from the Grove Vision AI Module V2
     * @param fromCache Use cached model info if available, default is true
     * @return An object containing the model info, including name, version, and supported classes
     */
    //% block="get ai model info"
    //% blockSetVariable=modelInfo
    //% group="Grove Vision AI V2"
    //% advanced=true
    //% weight=89
    export function getAIModelInfo(fromCache: boolean = true): ModelInfo {
        if (vision_ai_v2.atClient) {
            return vision_ai_v2.atClient.getModelInfo(fromCache);
        }
        return new ModelInfo("", "", []);
    }

    /**
     * Start AI inference on the Grove Vision AI Module V2
     * @param timeout The timeout in milliseconds for the inference operation, default is 1000ms
     * @param force Force start inference even if already running, default is true
     * @return True if inference started successfully, false otherwise
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
            _onDetectionResultsHandler(vision_ai_v2.detectionResults);
        }
    }

    function _onReceiveClassificationResults(classificationResults: ClassificationResult[]) {
        vision_ai_v2.classificationResults = classificationResults;
        if (_onClassificationResultsHandler) {
            _onClassificationResultsHandler(vision_ai_v2.classificationResults);
        }
    }

    function _onReceiveError(errorCode: OperationCode) {
        vision_ai_v2.errorCode = errorCode;
        if (_onErrorHandler) {
            _onErrorHandler(vision_ai_v2.errorCode);
        }
    }

    /**
     * Fetch AI inference results from the Grove Vision AI Module V2
     * @param maxResults The maximum number of results to fetch, default is 15
     * @param timeout The timeout in milliseconds for the fetch operation, default is 1000ms
     * @return True if results fetched successfully, false otherwise
     */
    //% block="fetch ai inference results"
    //% group="Grove Vision AI V2"
    //% weight=78
    //% color="#008B8D"
    export function fetchAIInferenceResults(
        maxResults: number = 15,
        timeout: number = 1000,
    ): boolean {
        vision_ai_v2.detectionResults = []
        vision_ai_v2.classificationResults = []

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
     * @param timeout The timeout in milliseconds for the stop operation, default is 1000ms
     */
    //% block="stop ai inference"
    //% group="Grove Vision AI V2"
    //% advanced=true
    //% weight=77
    export function stopAIInference(timeout: number = 1000) {
        if (vision_ai_v2.atClient) {
            vision_ai_v2.atClient.stopInference(timeout);
        }
    }

    /**
     * Get total number of specific object id(s)
     * @param ids An array of object IDs to count
     * @return The total count of objects with the specified IDs
     */
    //% block
    //% group="Grove Vision AI V2"
    //% advanced=true
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
     * @param labels An array of object names to count
     * @return The total count of objects with the specified names
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
     * @param ids An array of object IDs to check
     * @return True if any of the specified object IDs are found, false otherwise
     */
    //% block
    //% group="Grove Vision AI V2"
    //% advanced=true
    //% weight=67
    export function containsObjectId(ids: number[]): boolean {
        return countObjectById(ids) > 0;
    }

    /**
     * Check if contains specific object name(s)
     * @param labels An array of object names to check
     * @return True if any of the specified object names are found, false otherwise
     */
    //% block
    //% group="Grove Vision AI V2"
    //% weight=66
    export function containsObjectName(labels: string[]): boolean {
        return countObjectByName(labels) > 0;
    }

    /**
     * Event on receive detection results from the Grove Vision AI Module V2, the handler will
     * be called with the detection results when available, while fetching results from the device.
     * @param handler The callback function to handle detection results
     */
    //% block="on receive detection results"
    //% group="Grove Vision AI V2"
    //% advanced=true
    //% weight=59
    //% color="#AA278D"
    export function onReceiveDetectionResult(handler: (detectionResults: DetectionResult[]) => void) {
        _onDetectionResultsHandler = handler;
    }

    /**
     * Event on receive classification results from the Grove Vision AI Module V2, the handler will
     * be called with the classification results when available, while fetching results from the device.
     * @param handler The callback function to handle classification results
     */
    //% block="on receive classification results"
    //% group="Grove Vision AI V2"
    //% advanced=true
    //% weight=58
    //% color="#AA278D"
    export function onReceiveClassificationResult(handler: (classificationResults: ClassificationResult[]) => void) {
        _onClassificationResultsHandler = handler;
    }

    /**
     * Event on receive error from the Grove Vision AI Module V2, the handler will
     * be called with the error code when available, while fetching results from the device.
     * @param handler The callback function to handle error results
     */
    //% block="on receive error"
    //% group="Grove Vision AI V2"
    //% advanced=true
    //% weight=57
    //% color="#AA278D"
    export function onReceiveError(handler: (errorCode: OperationCode) => void) {
        _onErrorHandler = handler;
    }

    /**
     * Get fetched detection results from the Grove Vision AI Module V2
     * @return An array of DetectionResult objects containing the results of the last inference
     *          operation, or an empty array if no results are available.
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
     * @return An array of ClassificationResult objects containing the results of the last inference
     *          operation, or an empty array if no results are available.
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
     * @return The error code as an OperationCode enum value, indicating the status of the last inference operation.
     */
    //% block="get inference error code"
    //% blockSetVariable=errorCode
    //% group="Grove Vision AI V2"
    //% advanced=true
    //% weight=54
    export function getAIInferenceErrorCode(): OperationCode {
        return vision_ai_v2.errorCode;
    }

};
