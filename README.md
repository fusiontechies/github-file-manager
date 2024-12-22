Here’s a sample `README.md` for your npm package:

---

# GitHubFileStorage

A Node.js library for interacting with GitHub repositories to manage file storage. With this package, you can upload, download, list, and delete files from your GitHub repositories. Additionally, it supports the ability to download all files from a folder and package them into a ZIP file.

## Installation

To install the package, use npm:

```bash
npm install github-file-storage
```

## Usage

### Requirements

- **GitHub repository**: The repository you want to interact with (e.g., `username/repository`).
- **GitHub Personal Access Token**: You must generate a GitHub personal access token with appropriate permissions. [Create a token](https://github.com/settings/tokens) if you don't have one.

### Example

#### 1. **Creating an instance**

```javascript
const GitHubFileStorage = require('github-file-storage');
const storage = new GitHubFileStorage('username/repository', 'your-github-token');
```

#### 2. **Upload a file**

Uploads a file to the repository in Base64 format. If the file already exists, you can choose whether to overwrite it.

```javascript
const fileContent = 'base64-encoded-file-content-here';
const response = await storage.upload(fileContent, 'folder-path', 'filename.txt', true); // Overwrite is true
console.log(response.message); // "File uploaded successfully!" or "File updated successfully!"
```

#### 3. **List files in a repository or a specific folder**

List all files in the repository, or files from a specific folder.

```javascript
const response = await storage.listFiles('folder-path');
console.log(response.files); // Array of file objects
```

#### 4. **List all files including subdirectories**

This function lists all files recursively within a folder.

```javascript
const allFiles = await storage.listAllFiles('folder-path');
console.log(allFiles); // Array of file objects
```

#### 5. **Download a specific file**

Download a specific file either by URL or as base64 content.

```javascript
const fileResponse = await storage.download('folder-path', 'filename.txt');
console.log(fileResponse.data); // Base64 content or direct URL
```

#### 6. **Download all files in a folder as a ZIP**

Download all files in a folder and package them into a ZIP file.

```javascript
const zipFilePath = await storage.downloadAll('folder-path', './local-storage-path');
console.log('ZIP file created at: ', zipFilePath); // Path to the generated ZIP file
```

#### 7. **Delete a file**

Delete a file from the repository.

```javascript
const deleteResponse = await storage.deleteFile('folder-path', 'filename.txt');
console.log(deleteResponse.message); // "File deleted successfully!"
```

#### 8. **Get file content in Base64**

Fetch the content of a file as a Base64-encoded string.

```javascript
const content = await storage.getContentBase64('folder-path', 'filename.txt');
console.log(content); // { content: 'base64-content', filename: 'filename.txt' }
```

## Methods

### `upload(file, filepath = '', filename = 'uploaded_file.txt', overwrite = true)`

Uploads a file to the GitHub repository.

- **file** (string): The file content in base64 format.
- **filepath** (string, optional): The path where the file should be uploaded. Defaults to the root directory.
- **filename** (string, optional): The name of the file to be uploaded. Defaults to `uploaded_file.txt`.
- **overwrite** (boolean, optional): Whether to overwrite the file if it already exists. Defaults to `true`.

Returns an object with the message and the result of the upload.

### `listFiles(filepath = '')`

Lists files in the repository or a specific folder.

- **filepath** (string, optional): The folder path to list files from. Defaults to the root directory.

Returns an object with the files in the folder.

### `listAllFiles(filepath = '')`

Lists all files recursively from the repository or a specific folder, including subdirectories.

- **filepath** (string, optional): The folder path to list files from. Defaults to the root directory.

Returns an array of file objects.

### `download(filepath, filename)`

Downloads a specific file from the repository.

- **filepath** (string): The folder path where the file is located.
- **filename** (string): The name of the file to be downloaded.

Returns an object with either the file content in base64 or a direct download URL.

### `downloadAll(filepath = '', storagePath = '')`

Downloads all files from a specific folder and packages them into a ZIP file.

- **filepath** (string, optional): The folder path to download files from. Defaults to the root directory.
- **storagePath** (string, optional): The local path to save the ZIP file. Defaults to the current directory.

Returns the path to the generated ZIP file.

### `deleteFile(filepath, filename)`

Deletes a file from the repository.

- **filepath** (string): The folder path where the file is located.
- **filename** (string): The name of the file to be deleted.

Returns an object with the result of the delete operation.

### `getContentBase64(filepath, filename)`

Fetches the content of a file as a Base64-encoded string.

- **filepath** (string): The folder path where the file is located.
- **filename** (string): The name of the file to fetch.

Returns an object with the content (Base64) and filename.

## Installation

Install the package with npm:

```bash
npm install github-file-storage
```

## Requirements

- Node.js >= 14.0.0
- GitHub Personal Access Token with at least repo scope

## License

MIT License. See [LICENSE](LICENSE.txt) for details.

---

This README provides the necessary instructions for installing and using your package on npm, along with explanations of the available methods. Make sure to replace `username/repository` with the actual repository details when using the package, and to configure your personal access token for GitHub API authentication.