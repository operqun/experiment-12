async function loadRegistrations() {                       // Function that fetches and displays all registrations
  const res = await fetch("/api/registrations");            // Send GET request to the server and wait for the reply
  const data = await res.json();                            // Convert the JSON reply into a JavaScript array
  const tbody = document.querySelector("#regTable tbody");  // Find the table body where rows go
  tbody.innerHTML = "";                                     // Remove old rows before adding fresh ones
  data.forEach(r => {                                       // For every registration record r...
    tbody.innerHTML += `<tr><td>${r.id}</td><td>${r.name}</td><td>${r.event}</td></tr>`;  // ...add a row with id, name, event
  });                                                       // End of loop
  document.getElementById("count").textContent = data.length;  // Show the total number of registrations
}                                                           // End of loadRegistrations()

async function loadHost() {                                 // Function that shows which server/container answered
  const res = await fetch("/health");                       // Call the health endpoint
  const data = await res.json();                            // Read the JSON reply
  document.getElementById("host").textContent = data.host;  // Display the host name after "Served by:"
}                                                           // End of loadHost()

document.getElementById("regForm").addEventListener("submit", async function (e) {  // Run this when the form is submitted
  e.preventDefault();                                       // Stop the browser from reloading the page
  const name    = document.getElementById("name").value.trim();     // Read name, removing extra spaces
  const email   = document.getElementById("email").value.trim();    // Read email
  const phone   = document.getElementById("phone").value.trim();    // Read mobile number
  const college = document.getElementById("college").value.trim();  // Read college
  const event   = document.getElementById("event").value;           // Read the selected event ("" if none)
  const error   = document.getElementById("error");                 // Element for error messages
  const success = document.getElementById("success");               // Element for the success message
  error.textContent = "";                                   // Clear any old error
  success.textContent = "";                                 // Clear any old success message

  if (!name || !college) { error.textContent = "Name and College are required."; return; }  // Name and college must not be empty
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { error.textContent = "Please enter a valid email address."; return; }  // Email must look like x@y.z
  if (!/^[6-9][0-9]{9}$/.test(phone)) { error.textContent = "Mobile number must be 10 digits starting with 6-9."; return; }  // 10 digits, first digit 6-9
  if (!event) { error.textContent = "Please select an event."; return; }  // An event must be chosen

  const res = await fetch("/api/register", {                // Send the data to the server...
    method: "POST",                                         // ...using the POST method
    headers: { "Content-Type": "application/json" },        // ...telling the server the body is JSON
    body: JSON.stringify({ name, email, phone, college, event })  // ...with the five fields converted to JSON text
  });                                                       // Wait for the server's reply
  const data = await res.json();                            // Read the JSON reply
  if (res.ok) {                                             // If the status is 2xx (success)...
    success.textContent = data.message;                     // ...show the thank-you message
    this.reset();                                           // ...clear the form
    loadRegistrations();                                    // ...refresh the table and count
  } else {                                                  // Otherwise (400 or 409)...
    error.textContent = data.error;                         // ...show the server's error message
  }                                                         // End of if/else
});                                                         // End of submit handler

loadRegistrations();                                        // Fill the table as soon as the page opens
loadHost();                                                 // Show the serving host as soon as the page opens