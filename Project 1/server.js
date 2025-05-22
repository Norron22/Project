const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = 8080;

const comments = {};

function sendFile(res, filePath, contentType) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Erreur interne du serveur.");
        } else {
            res.writeHead(200, { "Content-Type": contentType });
            res.end(data);
        }
    });
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (pathname === "/") {
        sendFile(res, path.join(__dirname, "index.html"), "text/html");
    } else if (pathname === "/images-page") {
        const imagesDir = path.join(__dirname, "images");
        fs.readdir(imagesDir, (err, files) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Erreur lors de la récupération des images.");
                return;
            }

            const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file) && !file.includes('_small'));

            let html = `
                <!DOCTYPE html>
                <html lang="fr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Le mur d'images</title>
                    <link rel="stylesheet" href="style.css">
                </head>
                <body>
                    <a href="/" class="back-button">← Retour</a>
                    <h1>Le mur d'images</h1>
                    <div class="gallery">
            `;

            imageFiles.forEach(image => {
                html += `<a href="/page-image/${image}"><img src="/images/${image}" alt="${image}"></a>\n`;
            });

            html += `</div></body></html>`;
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(html);
        });
    } else if (pathname.startsWith("/page-image/")) {
        const imageId = decodeURIComponent(pathname.split("/page-image/")[1]);
        const imagesDir = path.join(__dirname, "images");

        fs.readdir(imagesDir, (err, files) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Erreur lors de la récupération des images.");
                return;
            }

            const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file) && !file.includes('_small'));
            const index = imageFiles.indexOf(imageId);
            const prevImage = index > 0 ? imageFiles[index - 1] : null;
            const nextImage = index < imageFiles.length - 1 ? imageFiles[index + 1] : null;

            const imageComments = comments[imageId] || [];
            let commentsHtml = '<h2>Commentaires</h2><ul>';
            imageComments.forEach(comment => {
                commentsHtml += `<li>${comment}</li>`;
            });
            commentsHtml += '</ul>';

            let html = `
                <!DOCTYPE html>
                <html lang="fr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Image ${imageId}</title>
                    <link rel="stylesheet" href="/style.css">
                </head>
                <body>
                    <a href="/images-page" class="back-button">← Retour au mur d'images</a>
                    <div class="image-container">
                        <img src="/images/${imageId}" alt="Image ${imageId}">
                        <div class="navigation">
                            ${prevImage ? `<a href="/page-image/${prevImage}"><img src="/images/${prevImage}" alt="Précédente" class="nav-img"></a>` : '<div></div>'}
                            ${nextImage ? `<a href="/page-image/${nextImage}"><img src="/images/${nextImage}" alt="Suivante" class="nav-img"></a>` : '<div></div>'}
                        </div>
                    </div>

                    <div class="comments-section">
                        ${commentsHtml}
                        <h2>Ajouter un commentaire</h2>
                        <form action="/image-description" method="POST">
                            <input type="hidden" name="imageId" value="${imageId}">
                            <textarea name="comment" required></textarea>
                            <button type="submit">Envoyer</button>
                        </form>
                    </div>
                </body>
                </html>
            `;

            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(html);
        });
    } else if (pathname === "/image-description" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        });
        req.on("end", () => {
            const params = new URLSearchParams(body);
            const imageId = params.get("imageId");
            const comment = params.get("comment");

            if (!comments[imageId]) {
                comments[imageId] = [];
            }
            comments[imageId].push(comment);

            console.log(`Commentaire ajouté pour l'image ${imageId}: ${comment}`);
            res.writeHead(302, { Location: `/page-image/${imageId}` });
            res.end();
        });
    } else if (pathname === "/logo.png") { // Ajoutez cette condition ici
            sendFile(res, path.join(__dirname, "logo.png"), "image/png");
    
        } else if (pathname.startsWith("/images/")) {
        const filePath = path.join(__dirname, pathname);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("Fichier non trouvé.");
            } else {
                res.writeHead(200, { "Content-Type": "image/jpeg" }); // Modifier le type MIME si nécessaire
                res.end(data);
            }
        });
    } else if (pathname === "/style.css") {
        sendFile(res, path.join(__dirname, "style.css"), "text/css");
    } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Page non trouvée.");
    }
});

server.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
