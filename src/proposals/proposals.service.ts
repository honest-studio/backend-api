import { Injectable } from '@nestjs/common';

@Injectable()
export class ProposalsService {
  get(hash: string): string {
    return hash;
  }
}
