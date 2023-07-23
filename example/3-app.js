// @ts-check
import createApp from 'express';
import session from 'express-session';

export const app = createApp();

app.use(session({
	secret: 'this_is_very_insecure',
	saveUninitialized: false,
	resave: true,
}));
