const nodemailer = require('nodemailer');
const { env } = require('./env');

const smtp = {
	host: env.SMTP_HOST || env.MAILER_HOST,
	port: Number(env.SMTP_PORT || env.MAILER_PORT || 587),
	user: env.SMTP_USER || env.MAILER_USER,
	pass: env.SMTP_PASS || env.MAILER_PASS,
	from: env.SMTP_FROM || env.MAILER_FROM,
};

const transporter = nodemailer.createTransport({
	host: smtp.host,
	port: smtp.port,
	secure: false,
	requireTLS: true,
	auth: {
		user: smtp.user,
		pass: smtp.pass,
	},
	tls: {
		minVersion: 'TLSv1.2',
	},
});

const verifyMailer = async () => {
	try {
		await transporter.verify();
		console.log(`[Mailer] SMTP transporter verified on ${smtp.host}:${smtp.port}`);
	} catch (error) {
		console.error(`[Mailer] SMTP verification failed: ${error.message}`);
		if (env.NODE_ENV === 'development' && env.MAILER_STRICT_STARTUP !== 'true') {
			console.warn('[Mailer] Continuing in development; set MAILER_STRICT_STARTUP=true to fail startup on SMTP errors.');
			return;
		}
		process.exit(1);
	}
};

module.exports = { transporter, verifyMailer, smtp };
