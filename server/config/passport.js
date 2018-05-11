import User from '../models/user';

const lodash = require('lodash');
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;


passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

/**
 * Sign in using Email/Username and Password.
 */
passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
  User.findByMailOrName(email.toLowerCase())
    .then((user) => { // eslint-disable-line consistent-return
      if (!user) {
        return done(null, false, { msg: `Email ${email} not found.` });
      }
      user.comparePassword(password, (innerErr, isMatch) => {
        if (isMatch) {
          return done(null, user);
        }
        return done(null, false, { msg: 'Invalid email or password.' });
      });
    })
    .catch(err => done(null, false, { msg: err }));
}));

/*
  Input:
  [
    { value: 'email@example.com', primary: false, verified: true },
    { value: 'unverified@example.com', primary: false, verified: false }
  ]

  Output:
    ['email@example.com']
*/
const getVerifiedEmails = githubEmails => (
  (githubEmails || [])
    .filter(item => item.verified === true)
    .map(item => item.value)
);

const getPrimaryEmail = githubEmails => (
  (
    lodash.find(githubEmails, { primary: true }) || {}
  ).value
);

/**
 * Sign in with GitHub.
 */
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_ID,
  clientSecret: process.env.GITHUB_SECRET,
  callbackURL: '/auth/github/callback',
  passReqToCallback: true,
  scope: ['user:email'],
}, (req, accessToken, refreshToken, profile, done) => {
  User.findOne({ github: profile.id }, (findByGithubErr, existingUser) => {
    if (existingUser) {
      done(null, existingUser);
      return;
    }

    const emails = getVerifiedEmails(profile.emails);
    const primaryEmail = getPrimaryEmail(profile.emails);

    User.findOne({
      email: { $in: emails },
    }, (findByEmailErr, existingEmailUser) => {
      if (existingEmailUser) {
        existingEmailUser.email = existingEmailUser.email || primaryEmail;
        existingEmailUser.github = profile.id;
        existingEmailUser.username = existingEmailUser.username || profile.username;
        existingEmailUser.tokens.push({ kind: 'github', accessToken });
        existingEmailUser.name = existingEmailUser.name || profile.displayName;
        existingEmailUser.verified = User.EmailConfirmation.Verified;
        existingEmailUser.save(saveErr => done(null, existingEmailUser));
      } else {
        const user = new User();
        user.email = primaryEmail;
        user.github = profile.id;
        user.username = profile.username;
        user.tokens.push({ kind: 'github', accessToken });
        user.name = profile.displayName;
        user.verified = User.EmailConfirmation.Verified;
        user.save(saveErr => done(null, user));
      }
    });
  });
}));

/**
 * Sign in with Google.
 */
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_ID,
  clientSecret: process.env.GOOGLE_SECRET,
  callbackURL: '/auth/google/callback',
  passReqToCallback: true,
  scope: ['email'],
}, (req, accessToken, refreshToken, profile, done) => {
  User.findOne({ google: profile._json.emails[0].value }, (findByGoogleErr, existingUser) => {
    if (existingUser) {
      done(null, existingUser);
      return;
    }

    const primaryEmail = profile._json.emails[0].value;

    User.findOne({
      email: primaryEmail,
    }, (findByEmailErr, existingEmailUser) => {
      if (existingEmailUser) {
        existingEmailUser.email = existingEmailUser.email || primaryEmail;
        existingEmailUser.google = profile._json.emails[0].value;
        existingEmailUser.username = existingEmailUser.username || profile._json.emails[0].value;
        existingEmailUser.tokens.push({ kind: 'google', accessToken });
        existingEmailUser.name = existingEmailUser.name || profile._json.displayName;
        existingEmailUser.verified = User.EmailConfirmation.Verified;
        existingEmailUser.save(saveErr => done(null, existingEmailUser));
      } else {
        const user = new User();
        user.email = primaryEmail;
        user.google = profile._json.emails[0].value;
        user.username = profile._json.emails[0].value;
        user.tokens.push({ kind: 'google', accessToken });
        user.name = profile._json.displayName;
        user.verified = User.EmailConfirmation.Verified;
        user.save(saveErr => done(null, user));
      }
    });
  });
}));
