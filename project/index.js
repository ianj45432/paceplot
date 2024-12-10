const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars'); // Corrected import
const dayjs = require('dayjs');

const app = express();
const port = 3000;

// Set up Handlebars
app.engine('handlebars', engine()); // Use the 'engine' function to create a Handlebars instance
app.set('view engine', 'handlebars');

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Home route
app.get('/', (req, res) => {
    const currentDate = dayjs().format('MMMM D, YYYY'); // Using dayjs to format the current date
    res.render('home', { currentDate });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// Telling Express to serve the files from the 'public' directory
app.use(express.static('public'));
