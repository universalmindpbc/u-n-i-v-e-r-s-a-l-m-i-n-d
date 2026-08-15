interface DeepARInterface {
    addPreRenderListener: (listener: () => void) => void;
    removePreRenderListener: (listener: () => void) => void;
    changeParameterVector: (name: string, parameterGroup: string, parameterType: string, index: number, x: number, y: number, z: number) => void;
}
export declare function addClock(deepAR: DeepARInterface, beatsPerSecond?: number): void;
export declare function removeClock(deepAR: DeepARInterface): void;
export {};
