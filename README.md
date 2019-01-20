# LaTeX2Image

![Image](screenshots/main.png)

A Node.js web application that allows LaTeX math equations to be entered and converted to PNG/JPG/SVG images.

For each conversion, an isolated Docker container with a LaTeX installation is started; it compiles the generated .tex file and converts it to an SVG vector image. If required, the SVG file is then converted to a raster image format for PNG/JPG.

Bootstrap and jQuery are used in the web interface, with AJAX calls made to the conversion API endpoint.

## Dependencies

### Docker

Docker CE with [non-root user support](https://docs.docker.com/install/linux/linux-postinstall/#manage-docker-as-a-non-root-user).

### [latex-docker](https://github.com/blang/latex-docker)

Docker image containing the required LaTeX packages preinstalled.
Pull the image:

```
docker pull blang/latex:ubuntu
```

### [Node.js](https://nodejs.org/en/download/)

Version 6 and onwards should suffice; I made use of v10.14.2.

### Global Node.js packages

#### [svgexport](https://www.npmjs.com/package/svgexport)

```
npm install svgexport -g
```

#### [imagemin-cli](https://www.npmjs.com/package/imagemin-cli)

```
npm install imagemin-cli -g
```

### Local Node.js packages

After cloning or downloading this project, run

```
cd latex2image-web/
npm install
```

## Usage

To run:

```
node app.js
```

The web interface will be accessible at `http://127.0.0.1:3001` by default. The port and HTTP URL can be modified inside `app.js`.

Enter a LaTeX equation, for example `\frac{a}{b}`, and press Convert. The result will be displayed below.

## Notes

* The directories `temp/` and `output/` will be generated automatically inside the `latex2image-web/` directory upon first launch.
* `temp/` stores temporary `.tex`, `.dvi`, and `.svg` files during compilation.
* Final output images are stored in `output/`.

## Authors

* **Joseph Rautenbach** - [joeraut](https://github.com/joeraut)

Also, see the list of [contributors](https://github.com/ImpactInc/build-indicator/graphs/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details