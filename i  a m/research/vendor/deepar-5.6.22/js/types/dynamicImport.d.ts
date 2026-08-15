import type * as xzimg from "./dynamicModules/xzimg";
import type * as mediaPipe from "./dynamicModules/mediaPipe";
import { CombinedGlobalProgress, GlobalProgress } from "./fetch";
export interface DynamicDeps {
    __deeparDynamicJsModule_xzimg__: typeof xzimg;
    __deeparDynamicJsModule_mediaPipe__: typeof mediaPipe;
}
export declare function disposeDynamicImports(): void;
export declare const dynamicImportXzimg: (path: string) => (progress: GlobalProgress | CombinedGlobalProgress) => Promise<typeof xzimg>;
export declare const dynamicImportMediaPipe: (path: string) => (progress: GlobalProgress | CombinedGlobalProgress) => Promise<typeof mediaPipe>;
