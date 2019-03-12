import { Injectable } from '@nestjs/common';
import { ConfigService } from '../common';
import { MysqlService, AWSSESService } from '../feature-modules/database';

@Injectable()
export class ContactUsService {
    constructor(private mysql: MysqlService, private awsSESService: AWSSESService) {}
    async submitContactUsForm(inputForm): Promise<any> {
        // Construct the HTML
        const HTMLBody = `Contact Type: ${inputForm.contacttype}<br><br>Message:<br>------------------------------<br>${inputForm.contacttext}\
        "<br>------------------------------<br>Sender: ${inputForm.contactname}<br>Email: ${inputForm.contactemail}\
        "<br>IP: ${inputForm.contactip}<br>User Agent: ${inputForm.contactuseragent}`;

        // Create sendEmail params
        const emailParams = {
            Destination: {
                BccAddresses: ["sam@everipedia.com", "mahbod@everipedia.com", "theodor@everipedia.com", "christian@everipedia.com", 
                            "angel@everipedia.com", "dave@everipedia.com", "navin@everipedia.com", "romi@everipedia.com"],
                ToAddresses: [this.awsSESService.getDefaultEmail(),]
            },
            Message: { 
                Body: { 
                    Html: {
                        Charset: "UTF-8",
                        Data: HTMLBody
                    },
                 },
                Subject: {
                    Charset: 'UTF-8',
                    Data: inputForm.contactsubject
                }
            },
            Source: this.awsSESService.getDefaultEmail(),
            ReplyToAddresses: [this.awsSESService.getDefaultEmail(),],
        };

        // Send the email
        const sendPromise = this.awsSESService.sendEmail(emailParams).promise();

        // Handle promise's fulfilled/rejected states
        sendPromise.then(
            function(data) {
                console.log(data.MessageId);
        }).catch(
            function(err) {
                console.error(err, err.stack);
        });

        return new Promise((resolve, reject) => {
            this.mysql.pool().query(
                `INSERT INTO ebdb.enterlink_contact (contactdate, contacttext, contactemail, contactname, contactsubject, 
                    contacttype, contactip, contactuseragent) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
                [inputForm.contactdate, inputForm.contacttext, inputForm.contactemail, inputForm.contactname, inputForm.contactsubject,
                    inputForm.contacttype, inputForm.contactip, inputForm.contactuseragent],
                function(err, rows) {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
}
