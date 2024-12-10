const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const axios = require('axios');
const qs = require('qs');
const app = express();

// Serve static files (CSS, images, JS) from the 'public' directory
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));


// Set up handlebars view engine
const hbs = exphbs.create({ defaultLayout: 'main' });
app.engine('handlebars', hbs.engine); // Set the engine using hbs.engine
app.set('view engine', 'handlebars');

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up session middleware
app.use(session({
  secret: '12345',
  resave: false,
  saveUninitialized: true,
}));

// Home route
app.get('/', (req, res) => {
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',   // Day of the week (e.g., "Monday")
        year: 'numeric',   // Full year (e.g., "2024")
        month: 'long',     // Full month name (e.g., "December")
        day: 'numeric',    // Day of the month (e.g., "9")
    });
    res.render('home', { currentDate }); // Pass currentDate to the template
});

// Dashoboard route
app.get('/dashboard', (req, res) => {
    // Dummy data for now; replace with actual Strava data
    const activities = [
      { name: 'Morning Run', distance: 5000, moving_time: 1800, start_date: '2024-12-08' },
      { name: 'Afternoon Run', distance: 4000, moving_time: 1500, start_date: '2024-12-09' }
    ];
    
    res.render('dashboard', {
      user: { firstname: 'Ian' },  // Replace with actual user data
      activities: activities
    });
  });
  

// Strava OAuth routes
app.get('/auth/strava', (req, res) => {
  const authorizationUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${STRAVA_REDIRECT_URI}&scope=read,activity:read`;
  res.redirect(authorizationUrl);
});

// Callback route to handle Strava's redirect after OAuth
app.get('/auth/strava/callback', async (req, res) => {
  const code = req.query.code;

  try {
    // Exchange the authorization code for an access token
    const response = await axios.post('https://www.strava.com/oauth/token', qs.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }));

    const accessToken = response.data.access_token;

    // Save the access token in the session for later use
    req.session.accessToken = accessToken;

    // Redirect to a page where the user can view their data or further features
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error during Strava OAuth callback:', error);
    res.status(500).send('An error occurred while authenticating with Strava.');
  }
});

// Dashboard route to show data after OAuth
app.get('/dashboard', async (req, res) => {
  const accessToken = req.session.accessToken;

  if (!accessToken) {
    return res.redirect('/');
  }

  try {
    // Fetch user data from Strava API
    const userResponse = await axios.get('https://www.strava.com/api/v3/athlete', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const activitiesResponse = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData = userResponse.data;
    const activitiesData = activitiesResponse.data;

    // Render the dashboard page with user and activity data
    res.render('dashboard', { user: userData, activities: activitiesData });
  } catch (error) {
    console.error('Error fetching data from Strava API:', error);
    res.status(500).send('An error occurred while fetching your Strava data.');
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
