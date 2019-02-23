import * as Joi from 'joi';
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException, Paramtype } from '@nestjs/common';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
    constructor(private readonly schema, private type: Array<Paramtype> = ['query', 'param', 'body']) {}

    transform(value: any, metadata: ArgumentMetadata) {
        if (this.type.includes(metadata.type)) {
            const ret = Joi.validate(value, this.schema);
            if (ret.error) {
                throw new BadRequestException(ret.error.details[0].message);
            }
            return ret.value; // with type conversions
        } else return value;
    }
}
