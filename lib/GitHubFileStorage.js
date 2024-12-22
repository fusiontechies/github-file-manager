const axios = require('axios');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

/**
 * GitHubFileStorage class provides methods to interact with a GitHub repository for file storage.
 */
class GitHubFileStorage {
    /**
     * Creates an instance of GitHubFileStorage.
     * @param {string} repo - The GitHub repository in the format 'owner/repo'.
     * @param {string} token - The GitHub personal access token.
     * @throws {Error} If the repository or token is not provided.
     */
    constructor(repo, token) {
        if (!repo || !token) {
            throw new Error('Repository and Token are required!');
        }

        this.repo = repo;
        this.token = token;
        this.apiUrl = `https://api.github.com/repos/${repo}/contents`;
    }

    /**
     * Uploads or updates a file in the GitHub repository.
     * @param {string} file - The file content in base64 format.
     * @param {string} [filepath=''] - The path where the file should be stored.
     * @param {string} [filename='uploaded_file'] - The name of the file.
     * @param {boolean} [overwrite=true] - Whether to overwrite the file if it already exists.
     * @returns {Promise<Object>} The result of the upload operation.
     * @throws {Error} If the file is not provided or there is an error during the upload.
     */
    async upload(file, filepath = '', filename = 'uploaded_file.txt', overwrite = true) {
        if (!file) throw new Error('File is required');

        // Clean up base64 string if it's passed in a 'data URI' format
        let fileContent = file;
        if (fileContent.startsWith('data:')) {
            const base64Index = fileContent.indexOf('base64,') + 'base64,'.length;
            fileContent = fileContent.slice(base64Index); // Strip metadata to get only the base64 string
        }

        const finalFilename = filename;  // Use provided filename (defaults to 'uploaded_file' if not provided)
        const finalFilepath = filepath || '';  // Use provided filepath (defaults to root directory if not provided)

        let sha = null;
        try {
            // Check if the file exists already (GET request)
            const response = await axios.get(`${this.apiUrl}/${finalFilepath}/${finalFilename}`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            sha = response.data.sha; // Get the SHA if file exists
        } catch (error) {
            if (error.response && error.response.status !== 404) {
                throw error; // Other errors (not 404) should be thrown
            }
        }

        if (sha && !overwrite) {
            // If the file exists and 'overwrite' is false, return a message indicating the file already exists
            return {
                message: 'File already exists!',
                data: null
            };
        }

        const commitMessage = sha ? `Update ${finalFilename}` : `Upload ${finalFilename}`;
        try {
            const apiRequest = sha
                ? axios.put(`${this.apiUrl}/${finalFilepath}/${finalFilename}`, {
                    message: commitMessage,
                    content: fileContent,
                    sha: sha  // Use sha to update the file
                }, {
                    headers: { Authorization: `Bearer ${this.token}` }
                })
                : axios.put(`${this.apiUrl}/${finalFilepath}/${finalFilename}`, {
                    message: commitMessage,
                    content: fileContent
                }, {
                    headers: { Authorization: `Bearer ${this.token}` }
                });

            const result = await apiRequest;

            return {
                message: sha ? 'File updated successfully!' : 'File uploaded successfully!',
                data: result.data
            };
        } catch (error) {
            throw new Error('Error uploading file to GitHub: ' + error.message);
        }
    }

    /**
     * Lists files in the repository or a specific folder.
     * @param {string} [filepath=''] - The path of the folder to list files from.
     * @returns {Promise<Object>} The list of files.
     * @throws {Error} If there is an error retrieving the files.
     */
    async listFiles(filepath = '') {
        try {
            const response = await axios.get(`${this.apiUrl}/${filepath}`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });

            const files = response.data.map(item => ({
                name: item.name,
                path: item.path,
                type: item.type,
                sha: item.sha,
                url: item.download_url // Direct URL for downloading
            }));

            return { message: 'Files retrieved successfully!', files };
        } catch (error) {
            throw new Error('Error retrieving files: ' + error.message);
        }
    }

    /**
     * Lists all files in a directory, including subdirectories.
     * @param {string} [filepath=''] - The path of the directory to list files from.
     * @returns {Promise<Object>} The list of all files.
     * @throws {Error} If there is an error retrieving the files.
     */
    async listAllFiles(filepath = '') {
        const files = [];
        async function getFilesInDirectory(path) {
            const response = await axios.get(`${this.apiUrl}/${path}`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });

            for (const item of response.data) {
                if (item.type === 'dir') {
                    await getFilesInDirectory.call(this, item.path);  // Recursive call for directories
                } else {
                    files.push({
                        name: item.name,
                        path: item.path,
                        type: item.type,
                        sha: item.sha,
                        url: item.download_url
                    });
                }
            }
        }

        await getFilesInDirectory.call(this, filepath);
        return { message: 'Files retrieved successfully!', files };
    }

    /**
     * Gets the content of a file as a Base64 string.
     * @param {string} filepath - The path of the file.
     * @param {string} filename - The name of the file.
     * @returns {Promise<Object>} The file content in base64 format.
     * @throws {Error} If the filepath or filename is not provided or there is an error fetching the file content.
     */
    async getContentBase64(filepath, filename) {
        if (!filepath || !filename) {
            throw new Error('Both filepath and filename are required!');
        }

        try {
            const response = await axios.get(`${this.apiUrl}/${filepath}/${filename}`, {
                headers: { Authorization: `Bearer ${this.token}` },
            });

            // Return the file content in base64 along with additional info
            return {
                content: response.data.content,  // The content field is already in base64 format
                filename: filename
            };
        } catch (error) {
            throw new Error('Error fetching file content from GitHub: ' + error.message);
        }
    }

    /**
     * Downloads a file from the repository.
     * @param {string} filepath - The path of the file.
     * @param {string} filename - The name of the file.
     * @returns {Promise<Object>} The file content in base64 format or the download URL.
     * @throws {Error} If the filepath or filename is not provided or there is an error downloading the file.
     */
    async download(filepath, filename) {
        if (!filepath || !filename) {
            throw new Error('Both filepath and filename are required!');
        }

        const filePath = `${filepath}/${filename}`;

        try {
            // Fetch the file metadata to get the content or download URL
            const response = await axios.get(`${this.apiUrl}/${filePath}`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });

            const fileContent = response.data.content; // base64 encoded content
            const downloadUrl = response.data.download_url; // The direct URL for downloading the file

            if (fileContent) {
                // If content is available, return it as base64 (assuming content is base64 encoded)
                return {
                    data: fileContent  // File content in base64
                };
            }

            if (downloadUrl) {
                // If a download URL is available, return the URL
                return {
                    url: downloadUrl  // Direct URL to download the file
                };
            }

            throw new Error('File content or download URL not found');
        } catch (error) {
            throw new Error('Error downloading file: ' + error.message);
        }
    }

    /**
     * Lists files in a directory, including subdirectories.
     * @param {string} [filepath=''] - The path of the directory to list files from.
     * @returns {Promise<Array>} The list of files.
     * @throws {Error} If there is an error retrieving the files.
     */
    async listFilesInDirectory(filepath = '') {
        const files = [];

        async function getFiles(path) {
            const response = await axios.get(`${this.apiUrl}/${path}`, {
                headers: { Authorization: `Bearer ${this.token}` },
            });

            for (const item of response.data) {
                if (item.type === 'dir') {
                    await getFiles(item.path); // Recursively fetch files in subdirectories
                } else {
                    files.push({
                        name: item.name,
                        path: item.path,
                        url: item.download_url,
                    });
                }
            }
        }

        await getFiles.call(this, filepath);
        return files;
    }

    /**
     * Downloads all files from a specific folder and packages them into a ZIP file.
     * @param {string} [filepath=''] - The path of the folder to download files from.
     * @param {string} [storagePath=''] - The local storage path to save the ZIP file.
     * @returns {Promise<string>} The path to the generated ZIP file.
     * @throws {Error} If there is an error downloading the files or creating the ZIP file.
     */
    async downloadAll(filepath = '', storagePath = '') {
        try {
            const files = await this.listFilesInDirectory(filepath); // List all files in the folder
    
            // Ensure the storagePath directory exists, create it if necessary
            const fullStoragePath = path.join(storagePath);
            if (!fs.existsSync(fullStoragePath)) {
                fs.mkdirSync(fullStoragePath, { recursive: true });  // Create directory and its parent directories if necessary
            }
    
            // Create a temporary file to store the ZIP
            const zipFilePath = path.join(fullStoragePath, 'output.zip');
            const output = fs.createWriteStream(zipFilePath);
            const archive = archiver('zip', { zlib: { level: 9 } });
    
            // Pipe the ZIP archive to the output stream
            archive.pipe(output);
    
            // Download and add each file to the ZIP
            for (const file of files) {
                const fileContent = await axios.get(file.url, {
                    headers: { Authorization: `Bearer ${this.token}` },
                    responseType: 'arraybuffer', // Handle binary data
                });
    
                // Add the file content to the ZIP archive
                archive.append(fileContent.data, { name: file.name });
            }
    
            // Finalize the ZIP file
            archive.finalize();
    
            return new Promise((resolve, reject) => {
                // Wait for the ZIP file to finish writing
                output.on('close', () => {
                    resolve(zipFilePath); // Return the path to the generated ZIP file
                });
    
                // Handle any errors during the archive process
                archive.on('error', (err) => {
                    reject(new Error('Error creating ZIP: ' + err.message));
                });
            });
    
        } catch (error) {
            throw new Error('Error downloading files: ' + error.message);
        }
    }

    /**
     * Deletes a file from the repository.
     * @param {string} filepath - The path of the file.
     * @param {string} filename - The name of the file.
     * @returns {Promise<Object>} The result of the delete operation.
     * @throws {Error} If the filepath or filename is not provided or there is an error deleting the file.
     */
    async deleteFile(filepath, filename) {
        if (!filepath || !filename) {
            throw new Error('Both filepath and filename are required!');
        }

        const filePath = `${filepath}/${filename}`;

        try {
            // Get the file's metadata (including SHA) before deleting it
            const response = await axios.get(`${this.apiUrl}/${filePath}`, {
                headers: {
                    Authorization: `Bearer ${this.token}`
                }
            });

            const sha = response.data.sha;  // SHA of the file
            const commitMessage = `Delete ${filename}`;  // Commit message for deletion

            // Make the DELETE request to GitHub API to remove the file
            const deleteResponse = await axios.delete(`${this.apiUrl}/${filePath}`, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                data: {
                    message: commitMessage,
                    sha: sha, // Provide the SHA of the file to be deleted
                    branch: 'main'  // You can specify a branch here (optional), default is 'main'
                }
            });

            return {
                message: 'File deleted successfully!',
                data: deleteResponse.data
            };
        } catch (error) {
            throw new Error('Error deleting file: ' + error.message);
        }
    }
}

module.exports = GitHubFileStorage;
