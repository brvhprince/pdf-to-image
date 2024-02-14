
const express = require('express');
const { pdf } = require('pdf-to-img');
const fs = require('fs');
const rimraf = require('rimraf');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// const randomString = () => Math.random().toString(36).substring(7);

const getFileName = url => url.split('/').pop();

// Route to convert PDF to images and return image links
app.get('/convert', async (req, res) => {
    const { url } = req.query;

    try {

        const fileName = getFileName(url);
        const outputDirectory = './public/images';
        // check if file slides already exists
        const checkDirectory = `./public/images/${fileName}-slide-1.jpg`;
        if (fs.existsSync(checkDirectory)) {
            const imageLinks = [];
            for (let i = 1; i <= 100; i++) {
                const imgPath = `${fileName}-slide-${i}.jpg`;
                const imagePath = `${outputDirectory}/${imgPath}`;
                if (fs.existsSync(imagePath)) {
                    imageLinks.push(`/images/${imgPath}`);
                } else {
                    break;
                }
            }
            res.json(imageLinks);
            return;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to download PDF (${response.status} ${response.statusText})`);
        }

        const pdfBuffer = await response.buffer();


        // Deleting the output folder if it exists
        rimraf.sync(outputDirectory);

        // Creates output folder
        fs.mkdirSync(outputDirectory, { recursive: true });

        let counter = 1;
        const document = await pdf(pdfBuffer, { scale: 3 });
        const imageLinks = [];
        for await (const image of document) {
            const imgPath = `${fileName}-slide-${counter}.jpg`;
            const imagePath = `${outputDirectory}/${imgPath}`;
            fs.writeFileSync(imagePath, image);
            imageLinks.push(`/images/${imgPath}`);
            counter++;
        }

        res.json(imageLinks);
    } catch (error) {
        console.error('Error converting PDF to images:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
