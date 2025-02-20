const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { google } = require('googleapis');
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.NODE_ENV==="development"?"http://localhost:4000":"https://gamersgambit.shop"}/auth/google/callback`,
},
async function (accessToken, refreshToken, profile, done) {
    try {
        // const oauth2Client = new google.auth.OAuth2();
        // oauth2Client.setCredentials({ access_token: accessToken });

        // const people = google.people({ version: 'v1', auth: oauth2Client });
        // const res = await people.people.get({
        //     resourceName: 'people/me',
        //     personFields: 'phoneNumbers',
        // });

        // console.log('Google People API response:', JSON.stringify(res.data, null, 2));

        // // Add the phone numbers to the profile object
        // profile.phoneNumbers = res.data.phoneNumbers || [];

        return done(null, profile);
    } catch (error) {
        console.error('Error fetching user info:', error);
        return done(error);
    }
}));
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

module.exports = passport;