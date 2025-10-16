# Secure Document Share

## Overview
Secure document share is a viewing web application that encrypts documents before uploading them. Users can share documents via unique URLs, and only those with the correct decryption key can access the contents.

## Features
- 🔒 **End-to-end encryption**: Documents are encrypted before uploading and can only be decrypted by authorized users.
- 📤 **Secure file upload**: PDFs can be uploaded and stored securely.
- 📡 **WebSocket-based updates**: Real-time updates through WebSockets.

### Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (LTS recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Setup
1. **Clone the repository**
   ```sh
   git clone https://github.com/H2-invent/secure-document-share.git
   cd secure-document-share
   ```
2. **Install dependencies**
   ```sh
   npm install
   ```
3. **Start the server**
   ```sh
   npm start
   ```
   Or with setting a specific port

   ```sh
   node server.mjs --port=<port>
   ```

## Contributing
Feel free to submit issues or pull requests to improve the project.

## License
This project is licensed under the BSL-2 License.
