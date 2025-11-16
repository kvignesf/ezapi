//var API_KEY = process.env.MAILGUN_API_KEY;
//var DOMAIN = process.env.MAILGUN_DOMAIN;

//const formData = require('form-data');
//const Mailgun = require('mailgun.js');
//const mailgun = new Mailgun(formData);
//const mg = mailgun.client({ username: 'api', key: API_KEY });
var nodemailer = require('nodemailer');
const shardInbxEmailId = process.env.SHAREDINBOX_EMAILID;
const shardInbxPasswrd = process.env.SHAREDINBOX_PASSWORD;
const smtpServer = process.env.O365_SMTP_SERVER;
const smtpPort = process.env.O365_SMTP_PORT;

const transporter = nodemailer.createTransport({
	host: smtpServer,
	port: smtpPort,
	auth: {
		user : shardInbxEmailId,
		pass:  shardInbxPasswrd
	}
});

exports.sendEmail = (data) => {
	transporter.sendMail({
		from: shardInbxEmailId,
		name: shardInbxEmailId,
		to: data.to,
		subject: data.subject,
		text: data.text
	})
}

exports.sendEmail2 = (data) => {
	transporter.sendMail({
		from: shardInbxEmailId,
		name: shardInbxEmailId,
		to: data.to,
		subject: data.subject,
		html: data.html,
		attachments: data.attachments
	})
}


/* exports.sendMail = (data) => {
	mg.messages
		.create(DOMAIN, data)
		.then((msg) => console.log(msg))
		.catch((err) => console.log(err));
};
 */

