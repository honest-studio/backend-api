import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';

/**
 * Abstract base class for app modules
 * Child modules must still use the @Injectable decorator
 */
export abstract class BaseModule implements OnModuleInit, OnModuleDestroy {
    constructor() {}
    onModuleInit() {
        console.log('--beginning base init!');
        if (this.onBeforeModuleInit) {
            this.onBeforeModuleInit();
        }
        console.log('--base init!');
        if (this.onAfterModuleInit) {
            this.onAfterModuleInit();
        }
    }
    onModuleDestroy() {}

    /**
     * Initialization methods to execute before main module init
     */
    protected onBeforeModuleInit?(): void;

    /**
     * Initialization methods to execute after main module init
     */
    protected onAfterModuleInit?(): void;
}

export class TestModule extends BaseModule {
    /**
     *
     */
    constructor() {
        super();
    }

    onBeforeModuleInit() {
        console.log('in child module before-init');
    }
    /*
    onAfterModuleInit() {
        console.log('in child module after-init');
    }
    */
}
