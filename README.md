# LookyLooky - Secure Document Viewer

## Overview
LookyLooky is a secure document sharing and viewing web application that encrypts documents before uploading them. Users can share documents via unique URLs, and only those with the correct decryption key can access the contents.

## Features
- 🔒 **End-to-end encryption**: Documents are encrypted before uploading and can only be decrypted by authorized users.
- 📤 **Secure file upload**: PDFs can be uploaded and stored securely.
- 📸 **Image preview**: Encrypted documents generate previews for easy identification.
- 📡 **WebSocket-based updates**: Real-time updates through WebSockets.
- 📂 **File sharing via secure links**: Share documents without exposing sensitive information.
- 🖼 **Slideshow mode**: View documents in a slideshow format with real-time updates.

## Installation

### Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (LTS recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Setup
1. **Clone the repository**
   ```sh
   git clone https://github.com/your-repo/lookylooky.git
   cd lookylooky
   ```
2. **Install dependencies**
   ```sh
   npm install
   ```
3. **Build the project**
   ```sh
   npm run build
   ```
4. **Start the server**
   ```sh
   npm start
   ```

## Usage

### Uploading a Document
1. Drag and drop a PDF file into the upload area.
2. The document is encrypted and uploaded.
3. A secure link is generated in the format:
   ```
   https://yourdomain.com/view/{docId}#key={base64-encoded-key}
   ```
4. Share this link with authorized users.

### Viewing a Document
1. Open the shared link.
2. The document ID is extracted from the URL.
3. The encryption key (from `#key=`) is decoded locally (not sent to the server).
4. The document is decrypted and displayed.

### Slideshow Mode
- Users joining the same document ID room will see real-time updates.
- The document presenter can change images, and all connected users will see the updates live.

## Security Considerations
- **The encryption key is never stored on the server.**
- **Users must ensure they share the correct `#key=` securely.**
- **Only authorized users with the exact decryption key can view the document.**

## Development


### Webpack Entry Points
- `index.js`: Main entry point for document uploads.
- `view.js`: Handles document viewing and WebSocket communication.

## Contributing
Feel free to submit issues or pull requests to improve the project.

## License
This project is licensed under the BSL-2 License.

