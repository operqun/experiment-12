const express = require("express");                  // Import Express, the web framework that handles HTTP requests
const path = require("path");                        // Import path module to build file paths safely
const fs = require("fs");                            // Import fs (file system) module to check if a file exists
const os = require("os");                            // Import os module to read the hostname (container ID in Docker)

const app = express();                               // Create the Express application object
const PORT = process.env.PORT || 3000;               // Port number: use the PORT environment variable, else 3000
const PUBLIC_DIR = path.join(__dirname, "public");   // Absolute path of the "public" folder holding the web files
const registrations = [];                            // In-memory array that stores registered participants

// Startup check: warn if the web page is missing (avoids "Cannot GET /")
if (!fs.existsSync(path.join(PUBLIC_DIR, "index.html"))) {           // If public/index.html does not exist...
  console.error(`ERROR: ${path.join(PUBLIC_DIR, "index.html")} not found.`);  // ...print which file is missing
  console.error("Put index.html, style.css and script.js inside the 'public' folder and rebuild the image.");  // ...and how to fix it
}                                                    // End of startup check

app.use(express.json());                             // Middleware: convert JSON request bodies into JavaScript objects
app.use(express.static(PUBLIC_DIR));                 // Middleware: serve index.html, style.css, script.js from public/

// Home page
app.get("/", (req, res) => {                         // When the browser requests "/" (home page)...
  res.sendFile(path.join(PUBLIC_DIR, "index.html")); // ...send back index.html
});                                                  // End of home route

// Health check - used by Docker and Kubernetes
app.get("/health", (req, res) => {                   // When "/health" is requested...
  res.json({ status: "UP", host: os.hostname() });   // ...reply with status UP and the host (container) name
});                                                  // End of health route

// List all registrations
app.get("/api/registrations", (req, res) => {        // When the list of registrations is requested...
  res.json(registrations);                           // ...send the whole array as JSON
});                                                  // End of list route

// Register a participant
app.post("/api/register", (req, res) => {            // When the form is submitted with POST...
  const { name, email, phone, college, event } = req.body;  // Take the five fields out of the request body
  if (!name || !email || !phone || !college || !event) {    // If any field is missing...
    return res.status(400).json({ error: "All fields are required." });  // ...reply 400 Bad Request with a message
  }                                                  // End of missing-field check
  if (registrations.some(r => r.email === email)) {  // If this email is already in the array...
    return res.status(409).json({ error: "This email is already registered." });  // ...reply 409 Conflict
  }                                                  // End of duplicate check
  const entry = { id: registrations.length + 1, name, email, college, event };  // Build a new record with the next id
  registrations.push(entry);                         // Add the record to the array
  res.status(201).json({                             // Reply 201 Created with a JSON body containing:
    message: `Thank you ${name}! You are registered for ${event}.`,  // the success message shown on the page,
    id: entry.id,                                    // the new registration id,
    servedBy: os.hostname()                          // and the name of the container that handled the request
  });                                                // End of reply
});                                                  // End of register route

app.listen(PORT, () => {                             // Start the server on PORT; when ready...
  console.log(`Event Registration App running on port ${PORT}`);  // ...print this line (visible in docker logs)
}); 