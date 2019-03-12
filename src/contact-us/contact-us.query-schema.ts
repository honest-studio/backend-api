import * as Joi from 'joi';

const ContactUSSchema = Joi.object().keys({
    contactdate: Joi.date().iso().required(),
    contacttext: Joi.string().required(),
    contactemail: Joi.string().email().required(),
    contactname: Joi.string().required(),
    contactsubject: Joi.string().required(),
    contacttype: Joi.string().regex(/^(Report Abuse|Report Bug|Verify Account|Anonymous Tip|Investment Inquiry|Other)$/igum).required(),
    contactip: Joi.string().ip(),
    contactuseragent: Joi.string().required()
});

export { ContactUSSchema };

const sampleInput =
{
    "contactdate": "2008-09-15T15:53:00",
    "contacttext": "SAMPLE CONTACT TEXT",
    "contactemail": "testemail@dddd.com",
    "contactname": "TEST NAME",
    "contactsubject": "API SUBJECT",
    "contacttype": "Report Abuse",
    "contactip": "66.66.66.66",
    "contactuseragent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0 Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0."
}


// import { IsString, IsEmail, IsIP, IsDateString, Matches } from 'class-validator';
// import { ApiModelProperty, ApiModelPropertyOptional} from '@nestjs/swagger';

// // Parameters for the media upload
// export class ContactUSDto {
//     @ApiModelProperty({ 
//         description: "The date",
//         required: true 
//     })
//     @IsDateString()
//     contact_date: string;

//     @ApiModelProperty({ 
//         description: "The text of the contact us form",
//         required: true 
//     })
//     @IsString()
//     contact_text: string;

//     @ApiModelProperty({ 
//         description: "The email of the submitter",
//         required: true 
//     })
//     @IsEmail()
//     contact_email: string;

//     @ApiModelProperty({ 
//         description: "Subject",
//         required: true 
//     })
//     @IsString()
//     contact_subject: string;

//     @ApiModelProperty({ 
//         description: "The type of contact",
//         required: true 
//     })
//     @IsString()
//     @Matches(/^(Report Abuse|Report Bug|Verify Account|Anonymous Tip|Investment Inquiry|Other)$/igum, {
//         message: "Needs to be either Report Abuse, Report Bug, Verify Account, Anonymous Tip, Investment Inquiry, Other"
//     })
//     contact_type: string;

//     @ApiModelProperty({ 
//         description: "IP address of the contact",
//         required: true 
//     })
//     @IsString()
//     contact_ip: string;

//     @ApiModelProperty({ 
//         description: "The user agent",
//         required: true 
//     })
//     @IsString()
//     contact_useragent: string;
// }
