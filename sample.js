// Import required modules
const express = require('express'); // Express framework for handling HTTP requests
const GitHubFileStorage = require('github-file-manager'); // GitHubFileManager for interacting with GitHub repositories
const multer = require('multer'); // Multer for handling file uploads
const upload = multer(); // Initialize multer for handling uploads without disk storage

// Initialize the Express app
const app = express();
const port = 3000; // Port where the server will run

// Initialize GitHubFileStorage with repository details and personal access token
const storage = new GitHubFileStorage(
    'username/repository',  // GitHub repository in 'owner/repo' format
    'your-github-token' // Personal Access Token (PAT) for GitHub API authentication
);

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to list files from a specific folder in the repository
app.get('/list', async (req, res) => {
    try {
        // Get the folder path from the query parameter, default to root if not provided
        const filepath = req.query.filepath || '';
        
        // Call the listFiles method to get the list of files from the GitHub repository
        const result = await storage.listFiles(filepath);
        
        // Send the result as JSON response
        res.json(result);
    } catch (error) {
        // Handle errors and respond with error message
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to list all files in the repository, including files in subdirectories
app.get('/listall', async (req, res) => {
    try {
        // Get the folder path from the query parameter, default to root if not provided
        const filepath = req.query.path || '';
        
        // Call the listAllFiles method to get all files from the repository
        const result = await storage.listAllFiles(filepath);
        
        // Send the result as JSON response
        res.json(result);
    } catch (error) {
        // Handle errors and respond with error message
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to download a specific file from the repository
app.get('/download/:filename', async (req, res) => {
    // Extract filename from URL parameters
    const { filename } = req.params;
    
    // Get the folder path from the query parameter, default to root if not provided
    const filepath = req.query.filepath || '';

    try {
        // Call the download method from GitHubFileStorage to get the file
        const result = await storage.download(filepath, filename);

        // Check if the result contains a direct download URL
        if (result.url) {
            // Redirect to the download URL if available
            res.redirect(result.url);
        } else if (result.data) {
            // If the file content is available in base64, decode and send it as response
            const fileContent = Buffer.from(result.data, 'base64');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.send(fileContent);
        } else {
            // If file content or download URL is not found, respond with 404
            res.status(404).json({ message: 'File not found' });
        }
    } catch (error) {
        // Handle errors and respond with error message
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to download all files from a specific folder as a ZIP file
app.get('/downloadall', async (req, res) => {
    try {
        // Get the folder path from the query parameter, default to root if not provided
        const filepath = req.query.filepath || '';
        
        // Call the downloadAll method to download all files from the folder
        const result = await storage.downloadAll(filepath, __dirname + '/downloads');
        
        // Send the result (path to the generated ZIP file) as JSON response
        res.json(result);
    } catch (error) {
        // Handle errors and respond with error message
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to get the content of a file as Base64
app.get('/getfile', async (req, res) => {
    try {
        // Get the folder path and filename from the query parameters
        const { filepath, filename } = req.query;
        
        // Call the getContentBase64 method to get the file content in Base64
        const result = await storage.getContentBase64(filepath, filename);
        
        // Send the result as JSON response
        res.json(result);
    } catch (error) {
        // Handle errors and respond with error message
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to delete a specific file from the repository
app.delete('/delete', async (req, res) => {
    // Extract filepath and filename from the request body
    const { filepath, filename } = req.body;
    
    try {
        // Call the deleteFile method to delete the file from the repository
        const result = await storage.deleteFile(filepath, filename);
        
        // Send the result as JSON response
        res.json(result);
    } catch (error) {
        // Handle errors and respond with error message
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to upload a file (binary or base64 encoded) to the repository
app.post('/upload', async (req, res) => {
    // Extract file content, filepath, and filename from the request body
    const { file, filepath, filename } = req.body;
    
    try {
        // Call the upload method to upload the file to the GitHub repository
        const result = await storage.upload(file, filepath, filename, false);
        
        // Send the result as JSON response
        res.json(result);
    } catch (error) {
        // Handle errors and respond with error message
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to upload a file in Base64 format to the repository using Multer
app.post('/uploadbase64', upload.single('file'), async (req, res) => {
    // Extract the filepath and filename from the request body
    const { filepath, filename } = req.body;
    
    // Convert the uploaded file to Base64 format
    const file = req.file.buffer.toString('base64');
    
    try {
        // Call the upload method to upload the file in Base64 format to the GitHub repository
        const result = await storage.upload(file, filepath, filename, true);
        
        // Send the result as JSON response
        res.json(result);
    } catch (error) {
        // Handle errors and respond with error message
        res.status(500).json({ error: error.message });
    }
});

// Start the server and listen on the specified port
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
