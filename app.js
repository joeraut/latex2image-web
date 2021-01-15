const fs = require('fs');
const fsPromises = fs.promises;
const shell = require('shelljs');
const express = require('express');
const promiseRouter = require('express-promise-router');
const queue = require('express-queue');
const sharp = require('sharp');
const Promise = require('bluebird');

const port = 3001;

const staticDir = 'static/';
const tempDirRoot = 'temp/';
const outputDir = 'output/';
const httpOutputURL = 'output/';

// Checklist of valid formats and scales, to verify form values are correct
const validFormats = ['SVG', 'PNG', 'JPG'];
const validScales = ['10%', '25%', '50%', '75%', '100%', '125%', '150%', '200%', '500%', '1000%'];
// Percentage scales mapped to floating point values used in arguments
const validScalesInternal = ['0.1', '0.25', '0.5', '0.75', '1.0', '1.25', '1.5', '2.0', '5.0', '10.0'];

// Command to compile .tex file to .dvi file. Timeout kills it after 5 seconds if held up
const latexCMD = 'timeout 5 latex -interaction nonstopmode -halt-on-error --no-shell-escape equation.tex';

// Command to convert .dvi to .svg file. Timeout kills it after 5 seconds if held up
const dvisvgmCMD = 'timeout 5 dvisvgm --no-fonts --scale=OUTPUT_SCALE --exact equation.dvi';

const dockerImageName = 'blang/latex:ubuntu'; // https://github.com/blang/latex-docker

// Command to run the above commands in a new Docker container (with LaTeX preinstalled)
const dockerCMD = `cd TEMP_DIR_NAME && exec docker run --rm -i --user="$(id -u):$(id -g)" --net=none -v "$PWD":/data "${dockerImageName}" /bin/sh -c "${latexCMD} && ${dvisvgmCMD}"`;

// LaTeX document template
const preamble = `
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{amsfonts}
\\usepackage[utf8]{inputenc}
`;

const documentTemplate = `
\\documentclass[12pt]{article}
${preamble}
\\thispagestyle{empty}
\\begin{document}
\\begin{align*}
EQUATION
\\end{align*}
\\end{document}`;

// Create temp and output directories on first run
if (!fs.existsSync(tempDirRoot)) {
  fs.mkdirSync(tempDirRoot);
}
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Allow static html files and output files to be accessible
app.use('/', express.static(staticDir));
app.use('/output', express.static(outputDir));

const conversionRouter = promiseRouter();
app.use(conversionRouter);

// Queue requests to ensure that only one is processed at a time, preventing
// multiple concurrent Docker containers from exhausting system resources
conversionRouter.use(queue({ activeLimit: 1, queuedLimit: -1 }));

// Conversion request endpoint
conversionRouter.post('/convert', async (req, res) => {
  const id = generateID(); // Generate a unique ID for this request

  try {
    if (!req.body.latexInput) {
      res.end(JSON.stringify({ error: 'No LaTeX input provided.' }));
      return;
    }

    if (!validScales.includes(req.body.outputScale)) {
      res.end(JSON.stringify({ error: 'Invalid scale.' }));
      return;
    }

    if (!validFormats.includes(req.body.outputFormat)) {
      res.end(JSON.stringify({ error: 'Invalid image format.' }));
      return;
    }

    const eqnInput = req.body.latexInput.trim();
    const fileFormat = req.body.outputFormat.toLowerCase();
    const outputScale = req.body.outputScale;

    // Generate and write the .tex file
    const document = documentTemplate.replace('EQUATION', eqnInput);
    await fsPromises.mkdir(`${tempDirRoot}${id}`);
    await fsPromises.writeFile(`${tempDirRoot}${id}/equation.tex`, document);

    // Run the LaTeX compiler and generate a .svg file
    const finalDockerCMD = dockerCMD
      .replace('TEMP_DIR_NAME', `${tempDirRoot}${id}`)
      .replace('OUTPUT_SCALE', validScalesInternal[validScales.indexOf(outputScale)]);
    await execAsync(finalDockerCMD);

    const inputSvgFileName = `${tempDirRoot}${id}/equation.svg`;
    const outputFileName = `${outputDir}img-${id}.${fileFormat}`;

    // Return the SVG image, no further processing required
    if (fileFormat === 'svg') {
      await fsPromises.copyFile(inputSvgFileName, outputFileName);

    // Convert to PNG
    } else if (fileFormat === 'png') {
      await sharp(inputSvgFileName, { density: 96 })
        .toFile(outputFileName); // Sharp's PNG type is implicitly determined via the output file extension

    // Convert to JPG
    } else {
      await sharp(inputSvgFileName, { density: 96 })
        .flatten({ background: { r: 255, g: 255, b: 255 } }) // as JPG is not transparent, use a white background
        .jpeg({ quality: 95 })
        .toFile(outputFileName);
    }

    await cleanupTempFilesAsync(id);
    res.end(JSON.stringify({ imageURL: `${httpOutputURL}img-${id}.${fileFormat}` }));

  } catch (e) {
    console.error(e);
    await cleanupTempFilesAsync(id);
    res.end(JSON.stringify({ error: 'Error converting LaTeX to image. Please ensure the input is valid.' }));
  }
});

// Start the server
app.listen(port, () => console.log(`Latex2Image listening at http://localhost:${port}/`));

// Helper functions

// Deletes temporary files created during a conversion request
function cleanupTempFilesAsync(id) {
  return fsPromises.rmdir(`${tempDirRoot}${id}`, { recursive: true });
}

// Execute a shell command
function execAsync(cmd, opts = {}) {
  return new Promise((resolve, reject) => {
    shell.exec(cmd, opts, (code, stdout, stderr) => {
      if (code != 0) reject(new Error(stderr));
      else resolve(stdout);
    });
  });
}

function generateID() {
  // Generate a random 16-char hexadecimal ID
  let output = '';
  for (let i = 0; i < 16; i++) {
    output += '0123456789abcdef'.charAt(Math.floor(Math.random() * 16));
  }
  return output;
}
