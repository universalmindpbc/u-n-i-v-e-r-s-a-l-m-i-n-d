/**
 * Thrown when the switch effect is canceled before it successfully finishes.
 */
export declare class SwitchEffectCanceled extends Error {
    constructor(message?: string);
}
export declare class NoCameraError extends Error {
    constructor(message?: string);
}
export declare class CameraPermissionDeniedError extends Error {
    constructor(message?: string);
}
