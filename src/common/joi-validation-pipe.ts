import * as Joi from 'joi';
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
    constructor(private readonly schema) {}

    transform(value: any, metadata: ArgumentMetadata) {
        const ret = Joi.validate(value, this.schema);
        if (ret.error) {
            throw new BadRequestException(ret.error.details[0].message);
        }
        return ret.value; // with type conversions
    }
}
