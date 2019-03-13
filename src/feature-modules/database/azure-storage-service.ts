import { Injectable } from '@nestjs/common';
import { AzureStorageConfig, ConfigService } from '../../common';
import { createBlobService } from 'azure-storage';

@Injectable()
export class AzureStorageService {
    // private readonly _azureStorageConfig: AzureStorageConfig;
    // private _blobService;

    // constructor(config: ConfigService) {
    //     // Fetch the Azure config info
    //     this._azureStorageConfig = config.get('azureStorageConfig');

    //     // Initialize the Azure connection
    //     this._blobService = createBlobService(this._azureStorageConfig.azureStorageAccountName, 
    //                                          this._azureStorageConfig.azureStorageAccountKey);
    // }

    // // Return the appendBlockFromText function
    // // https://azure.github.io/azure-storage-node/BlobService.html
    // appendBlockFromText(...args){
    //     return this.appendBlockFromText(...args);
    // }

}
