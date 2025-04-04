// Import dotenv to load environment variables from a .env file into process.env
import dotenv from 'dotenv';

// Import the database connection function
import connectDB from './db/connection.js';

// Import the app instance from app.js
import { app } from './app.js';

// Load environment variables from .env file
dotenv.config({ path: './.env' });

/* 
 * Event listener for handling application-level errors.
 * If the app encounters an error, log a message and throw the error.
 */
app.on("error", (error) => {
    console.log('Application not able to talk to DB', error);
    throw error;
});

// Connect to the database
connectDB()
    .then(() => {
        // Start the server once the DB connection is successful
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port: ${process.env.PORT || 8000}`);
        });
    })
    .catch((err) => {
        // Log an error message if the DB connection fails
        console.log('MONGODB Connection Failed !!!', err);
    });

/*
 * Note:
 * In the package.json file, the following command can be used for development:
 * "dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js"
 * 
 * Explanation:
 * -r dotenv/config: Automatically loads environment variables from the .env file.
 * --experimental-json-modules: Enables experimental support for importing JSON modules.
 */
