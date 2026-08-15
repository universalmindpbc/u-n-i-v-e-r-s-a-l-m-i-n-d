export declare function setFileSizes(sizes: any): void;
export interface Progress {
    loaded: number;
    total: number;
}
interface FileProgress extends Progress {
    isFailed: boolean;
    dataPromise: Promise<ArrayBuffer>;
    data: ArrayBuffer | null;
    isStarted: boolean;
    xhr: XMLHttpRequest;
    isLengthComputable: boolean;
    isEventLengthComputable: boolean;
    isCancelled: boolean;
}
export declare class GlobalProgress {
    private files;
    private totalProgress;
    onProgress?: (progress: Progress) => void;
    startImmediately: boolean;
    constructor(startImmediately?: boolean);
    downloadFile(url: string, type?: XMLHttpRequestResponseType, startImmediately?: boolean): Promise<ArrayBuffer>;
    addCustomProgress(): (progress: Progress) => void;
    private reportProgress;
    getFileProgress(url: string): FileProgress;
    getProgress(): Progress;
    getFilePromises(url: string): Promise<ArrayBuffer>;
    getFileData(url: string): ArrayBuffer | null;
    getFilesList(): string[];
    isUrlTracked(url: string): boolean;
    dispose(): void;
    startDownloading(): void;
    allFilesHaveSize(): boolean;
}
export declare class CombinedGlobalProgress {
    private progressArray;
    private progressGroupId;
    private groupWeight;
    private totalProgress;
    onProgress?: (progress: Progress) => void;
    addGlobalProgress(globalProgress: GlobalProgress, groupId?: number): void;
    setGroupWeight(groupId: number, weight: number): void;
    getFileProgress(url: string): FileProgress;
    getProgress(): Progress;
    getFilePromises(url: string): Promise<ArrayBuffer>;
    getFileData(url: string): ArrayBuffer | null;
    getFilesList(): string[];
    isUrlTracked(url: string): boolean;
    dispose(): void;
}
export {};
