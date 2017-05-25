/** A class wrapping a canvas element */
class CanvasWrapper {
    /**
     * The constructor for the class CanvasWrapper.
     *
     * @param {string|HTMLElement} target The canvas id or the canvas HTMLElement.
     * @param {object} theme A theme from the smiles drawer options.
     * @param {any} options The smiles drawer options object.
     */
    constructor(target, theme, options) {
        if (typeof target === 'string' || target instanceof String) {
            this.canvas = document.getElementById(target);
        } else {
            this.canvas = target;
        }

        this.ctx = this.canvas.getContext('2d');
        this.colors = theme;
        this.opts = options
        this.drawingWidth = 0.0;
        this.drawingHeight = 0.0;
        this.offsetX = 0.0;
        this.offsetY = 0.0;

        this.fontLarge = this.opts.fontSizeLarge + 'pt Droid Sans, sans-serif';
        this.fontSmall = this.opts.fontSizeSmall + 'pt Droid Sans, sans-serif';

        this.updateSize(this.opts.width, this.opts.height);

        this.clear();
    }

    /**
     * Update the width and height of the canvas
     * 
     * @param {number} width 
     * @param {number} height 
     */
    updateSize(width, height) {
        this.devicePixelRatio = window.devicePixelRatio || 1;
        this.backingStoreRatio = this.ctx.webkitBackingStorePixelRatio ||  this.ctx.mozBackingStorePixelRatio || 
                                 this.ctx.msBackingStorePixelRatio ||  this.ctx.oBackingStorePixelRatio || 
                                 this.ctx.backingStorePixelRatio || 1;
        this.ratio = this.devicePixelRatio / this.backingStoreRatio;

        if (this.ratio !== 1) {      
            this.canvas.width = width * this.ratio;
            this.canvas.height = height * this.ratio;
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';
            this.ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
        } else {
            this.canvas.width = width * this.ratio;
            this.canvas.height = height * this.ratio;
        }
    }

    /**
     * Sets a provided theme.
     *
     * @param {object} theme A theme from the smiles drawer options.
     */
    setTheme(theme) {
        this.colors = theme;
    }

    /**
     * Scale the canvas based on vertex positions.
     *
     * @param {array} vertices An array of vertices containing the vertices associated with the current molecule.
     */
    scale(vertices) {
        // Figure out the final size of the image
        let maxX = -Number.MAX_VALUE;
        let maxY = -Number.MAX_VALUE;
        let minX = Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;

        for (var i = 0; i < vertices.length; i++) {
            let p = vertices[i].position;

            if (maxX < p.x) maxX = p.x;
            if (maxY < p.y) maxY = p.y;
            if (minX > p.x) minX = p.x;
            if (minY > p.y) minY = p.y;
        }

        // Add padding
        var padding = 20.0;
        maxX += padding;
        maxY += padding;
        minX -= padding;
        minY -= padding;

        this.drawingWidth = maxX - minX;
        this.drawingHeight = maxY - minY;

        var scaleX = this.canvas.offsetWidth / this.drawingWidth;
        var scaleY = this.canvas.offsetHeight / this.drawingHeight;

        var scale = (scaleX < scaleY) ? scaleX : scaleY;

        this.ctx.scale(scale, scale);

        this.offsetX = -minX;
        this.offsetY = -minY;

        // Center
        if (scaleX < scaleY) {
            this.offsetY += this.canvas.offsetHeight / (2.0 * scale) - this.drawingHeight / 2.0;
        } else {
            this.offsetX += this.canvas.offsetWidth / (2.0 * scale) - this.drawingWidth / 2.0;
        }
    }

    /**
     * Resets the transform of the canvas.
     *
     */
    reset() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    /**
     * Returns the hex code of a color associated with a key from the current theme.
     *
     * @param {string} key The color key in the theme (e.g. C, N, BACKGROUND, ...).
     * @returns {string} A color hex value.
     */
    getColor(key) {
        key = key.toUpperCase();

        if (key in this.colors) {
            return this.colors[key];
        }

        return this.colors['C'];
    }

    /**
     * Draws a circle to a canvas context.
     * @param {number} x The x coordinate of the circles center.
     * @param {number} y The y coordinate of the circles center.
     * @param {number} radius The radius of the circle
     * @param {string} color A hex encoded color.
     * @param {boolean} [fill=true] Whether to fill or stroke the circle.
     * @param {boolean} [debug=false] Draw in debug mode.
     * @param {string} [debugText=''] A debug message.
     */
    drawCircle(x, y, radius, color, fill = true, debug = false, debugText = '') {
        let ctx = this.ctx;
        let offsetX = this.offsetX;
        let offsetY = this.offsetY;

        ctx.save();
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + offsetX, y + offsetY, radius, 0, MathHelper.twoPI, true);
        ctx.closePath();

        if (debug) {
            if (fill) {
                ctx.fillStyle = '#f00';
                ctx.fill();
            } else {
                ctx.strokeStyle = '#f00';
                ctx.stroke();
            }

            this.drawDebugText(x, y, debugText);
        } else {
            if (fill) {
                ctx.fillStyle = color;
                ctx.fill();
            } else {
                ctx.strokeStyle = color;
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    /**
     * Draw a line to a canvas.
     *
     * @param {Line} line A line.
     */
    drawLine(line) {
        if (isNaN(line.from.x) || isNaN(line.from.y) ||
            isNaN(line.to.x) || isNaN(line.to.y)) {
            return;
        }

        let ctx = this.ctx;
        let offsetX = this.offsetX;
        let offsetY = this.offsetY;

        // Add a shadow behind the line
        let shortLine = line.clone().shorten(8.0);

        let l = shortLine.getLeftVector().clone();
        let r = shortLine.getRightVector().clone();

        l.x += offsetX;
        l.y += offsetY;

        r.x += offsetX;
        r.y += offsetY;

        // Draw the "shadow"
        /*
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(r.x, r.y);
        ctx.lineCap = 'round';
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = this.getColor('BACKGROUND');
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
        */
        l = line.getLeftVector().clone();
        r = line.getRightVector().clone();

        l.x += offsetX;
        l.y += offsetY;

        r.x += offsetX;
        r.y += offsetY;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(r.x, r.y);
        ctx.lineCap = 'round';
        ctx.lineWidth = 1.5;

        let gradient = this.ctx.createLinearGradient(l.x, l.y, r.x, r.y);
        gradient.addColorStop(0.4, this.getColor(line.getLeftElement()) ||
            this.getColor('C'));
        gradient.addColorStop(0.6, this.getColor(line.getRightElement()) ||
            this.getColor('C'));

        ctx.strokeStyle = gradient;

        ctx.stroke();
        ctx.restore();
    }

    /**
     * Draw a wedge on the canvas.
     *
     * @param {Line} line A line.
     * @param {number} width The wedge width.
     */
    drawWedge(line, width = 3.0) {
        if (isNaN(line.from.x) || isNaN(line.from.y) ||
            isNaN(line.to.x) || isNaN(line.to.y)) {
            return;
        }

        let ctx = this.ctx;
        let offsetX = this.offsetX;
        let offsetY = this.offsetY;

        // Add a shadow behind the line
        let shortLine = line.clone().shorten(8.0);

        let l = shortLine.getLeftVector().clone();
        let r = shortLine.getRightVector().clone();

        l.x += offsetX;
        l.y += offsetY;

        r.x += offsetX;
        r.y += offsetY;

        l = line.getLeftVector().clone();
        r = line.getRightVector().clone();

        l.x += offsetX;
        l.y += offsetY;

        r.x += offsetX;
        r.y += offsetY;

        ctx.save();

        let normals = Vector2.normals(l, r);

        normals[0].normalize();
        normals[1].normalize();

        let isRightChiralCenter = line.getRightChiral();

        let start = l;
        let end = r;

        if (isRightChiralCenter) {
            start = r;
            end = l;
        }

        let t = Vector2.add(start, Vector2.multiplyScalar(normals[0], 0.75));
        let u = Vector2.add(end, Vector2.multiplyScalar(normals[0], width));
        let v = Vector2.add(end, Vector2.multiplyScalar(normals[1], width));
        let w = Vector2.add(start, Vector2.multiplyScalar(normals[1], 0.75));

        ctx.beginPath();
        ctx.moveTo(t.x, t.y);
        ctx.lineTo(u.x, u.y);
        ctx.lineTo(v.x, v.y);
        ctx.lineTo(w.x, w.y);

        let gradient = this.ctx.createRadialGradient(r.x, r.y, this.opts.bondLength, r.x, r.y, 0);
        gradient.addColorStop(0.4, this.getColor(line.getLeftElement()) || 
                this.getColor('C'));
        gradient.addColorStop(0.6, this.getColor(line.getRightElement()) || 
                this.getColor('C'));
    
        ctx.fillStyle = gradient;

        ctx.fill();
        ctx.restore();
    }

    /**
     * Draw a dashed wedge on the canvas.
     *
     * @param {Line} line A line.
     * @param {number} width The wedge width.
     */
    drawDashedWedge(line, width = 6.0) {
        if (isNaN(line.from.x) || isNaN(line.from.y) ||
            isNaN(line.to.x) || isNaN(line.to.y)) {
            return;
        }

        let ctx = this.ctx;
        let offsetX = this.offsetX;
        let offsetY = this.offsetY;

        let l = line.getLeftVector().clone();
        let r = line.getRightVector().clone();

        l.x += offsetX;
        l.y += offsetY;

        r.x += offsetX;
        r.y += offsetY;

        ctx.save();

        let normals = Vector2.normals(l, r);

        normals[0].normalize();
        normals[1].normalize();

        let isRightChiralCenter = line.getRightChiral();

        let start;
        let end;
        let sStart;
        let sEnd;

        let shortLine = line.clone();

        if (isRightChiralCenter) {
            start = r;
            end = l;

            shortLine.shortenRight(3.0);

            sStart = shortLine.getRightVector().clone();
            sEnd = shortLine.getLeftVector().clone();
        } else {
            start = l;
            end = r;

            shortLine.shortenLeft(3.0);

            sStart = shortLine.getLeftVector().clone();
            sEnd = shortLine.getRightVector().clone();
        }

        sStart.x += offsetX;
        sStart.y += offsetY;
        sEnd.x += offsetX;
        sEnd.y += offsetY;

        let t = Vector2.add(start, Vector2.multiplyScalar(normals[0], 0.75));
        let u = Vector2.add(end, Vector2.multiplyScalar(normals[0], width / 2.0));
        let v = Vector2.add(end, Vector2.multiplyScalar(normals[1], width / 2.0));
        let w = Vector2.add(start, Vector2.multiplyScalar(normals[1], 0.75));

        ctx.beginPath();
        ctx.moveTo(t.x, t.y);
        ctx.lineTo(u.x, u.y);
        ctx.lineTo(v.x, v.y);
        ctx.lineTo(w.x, w.y);

        let gradient = this.ctx.createRadialGradient(r.x, r.y, this.bondLength, r.x, r.y, 0);
        gradient.addColorStop(0.4, this.getColor(line.getLeftElement()) ||
            this.getColor('C'));
        gradient.addColorStop(0.6, this.getColor(line.getRightElement()) ||
            this.getColor('C'));

        ctx.fillStyle = gradient;

        ctx.fill();

        // Now dash it
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.moveTo(sStart.x, sStart.y);
        ctx.lineTo(sEnd.x, sEnd.y);
        ctx.lineCap = 'butt';
        ctx.lineWidth = width;
        ctx.setLineDash([1, 1]);
        ctx.strokeStyle = this.getColor('BACKGROUND');
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
    }

    /**
     * Draws a debug text message at a given position
     *
     * @param {number} x The x coordinate.
     * @param {number} y The y coordinate.
     * @param {string} text The debug text.
     */
    drawDebugText(x, y, text) {
        let ctx = this.ctx;

        ctx.save();
        ctx.font = '5px Droid Sans, sans-serif';
        ctx.textAlign = 'start';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ff0000';
        ctx.fillText(text, x + this.offsetX, y + this.offsetY);
        ctx.restore();
    }

    /**
     * Draw a ball to the canvas.
     *
     * @param {number} x The x position of the text.
     * @param {number} y The y position of the text.
     * @param {string} elementName The name of the element (single-letter).
     * @param {number} hydrogens The number of hydrogen atoms.
     */
    drawBall(x, y, elementName) {
        let ctx = this.ctx;

        ctx.save();
        ctx.beginPath();
        ctx.arc(x + this.offsetX, y + this.offsetY, this.opts.bondLength / 4.5, 0, MathHelper.twoPI, false);
        ctx.fillStyle = this.getColor(elementName);
        ctx.fill();
    }

    /**
     * Draw a text to the canvas.
     *
     * @param {number} x The x position of the text.
     * @param {number} y The y position of the text.
     * @param {string} elementName The name of the element (single-letter).
     * @param {number} hydrogens The number of hydrogen atoms.
     * @param {string} direction The direction of the text in relation to the associated vertex.
     * @param {boolean} isTerminal A boolean indicating whether or not the vertex is terminal.
     * @param {string} charge The charge of the atom.
     * @param {number} isotope The isotope number.
     * @param {object} [pseudoElements={}] An object containing pseudo elements or shortcut elements and their count. E.g. { 'F': 3 }, { 'O': 2, 'H': 1 }.
     */
    drawText(x, y, elementName, hydrogens, direction, isTerminal, charge, isotope, pseudoElements = {}) {
        let ctx = this.ctx;
        let offsetX = this.offsetX;
        let offsetY = this.offsetY;

        ctx.save();
        
        let fontSizeLarge = this.opts.fontSizeLarge;
        let fontSizeSmall = this.opts.fontSizeSmall;

        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';

        let pseudoElementHandled = false;

        // Charge
        let chargeText = '+'
        let chargeWidth = 0;

        if (charge) {
            if (charge === 2) {
                chargeText = '2+';
            } else if (charge === -1) {
                chargeText = '-';
            } else if (charge === -2) {
                chargeText = '2-';
            }

            ctx.font = this.fontSmall;
            chargeWidth = ctx.measureText(chargeText).width;
        }

        let isotopeText = '0';
        let isotopeWidth = 0;

        if (isotope > 0) {
            isotopeText = isotope;
            ctx.font = this.fontSmall;
            isotopeWidth = ctx.measureText(isotopeText).width;
        }

        ctx.font = this.fontLarge;
        ctx.fillStyle = this.getColor(elementName);

        let dim = ctx.measureText(elementName);

        dim.totalWidth = dim.width + chargeWidth;
        dim.height = parseInt(this.fontLarge, 10);

        let r = (dim.width > fontSizeLarge) ? dim.width : this.opts.fontSizeLarge;
        r /= 1.25;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x + offsetX, y + offsetY, r, 0, MathHelper.twoPI * 2, true);
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        let cursorPos = -dim.width / 2.0;
        let cursorPosLeft = -dim.width / 2.0;

        ctx.fillStyle = this.getColor(elementName);
        ctx.fillText(elementName, x + offsetX + cursorPos, y + this.opts.fontSizeLarge / 2.0 + offsetY);
        cursorPos += dim.width;

        if (charge) {
            ctx.font = this.fontSmall;
            ctx.fillText(chargeText, x + offsetX + cursorPos, y - this.opts.fontSizeSmall / 5.0 + offsetY);
            cursorPos += chargeWidth;
        }

        if (isotope > 0) {
            ctx.font = this.fontSmall;
            ctx.fillText(isotopeText, x + offsetX + cursorPosLeft - isotopeWidth, y - this.opts.fontSizeSmall / 5.0 + offsetY);
            cursorPosLeft -= isotopeWidth;
        }

        ctx.font = this.fontLarge;

        let hydrogenWidth = 0;
        let hydrogenCountWidth = 0;

        if (hydrogens === 1) {
            let hx = x + offsetX;
            let hy = y + offsetY + fontSizeLarge / 2.0;

            hydrogenWidth = ctx.measureText('H').width;
            cursorPosLeft -= hydrogenWidth;

            if (direction === 'left') {
                hx += cursorPosLeft;
            } else if (direction === 'right') {
                hx += cursorPos;
            } else if (direction === 'up' && isTerminal) {
                hx += cursorPos;
            } else if (direction === 'down' && isTerminal) {
                hx += cursorPos;
            } else if (direction === 'up' && !isTerminal) {
                hy -= this.opts.fontSizeLarge + this.opts.fontSizeLarge / 4.0;
                hx -= hydrogenWidth / 2.0;
            } else if (direction === 'down' && !isTerminal) {
                hy += this.opts.fontSizeLarge + this.opts.fontSizeLarge / 4.0;
                hx -= hydrogenWidth / 2.0;
            }

            ctx.fillText('H', hx, hy);

            cursorPos += hydrogenWidth;
        } else if (hydrogens > 1) {
            let hx = x + offsetX;
            let hy = y + offsetY + fontSizeLarge / 2.0;

            hydrogenWidth = ctx.measureText('H').width;
            ctx.font = this.fontSmall;
            hydrogenCountWidth = ctx.measureText(hydrogens).width;
            cursorPosLeft -= hydrogenWidth + hydrogenCountWidth;

            if (direction === 'left') {
                hx += cursorPosLeft;
            } else if (direction === 'right') {
                hx += cursorPos;
            } else if (direction === 'up' && isTerminal) {
                hx += cursorPos;
            } else if (direction === 'down' && isTerminal) {
                hx += cursorPos;
            } else if (direction === 'up' && !isTerminal) {
                hy -= this.opts.fontSizeLarge + this.opts.fontSizeLarge / 4.0;
                hx -= hydrogenWidth / 2.0;
            } else if (direction === 'down' && !isTerminal) {
                hy += this.opts.fontSizeLarge + this.opts.fontSizeLarge / 4.0;
                hx -= hydrogenWidth / 2.0;
            }

            ctx.font = this.fontLarge;
            ctx.fillText('H', hx, hy)

            ctx.font = this.fontSmall;
            ctx.fillText(hydrogens, hx + hydrogenWidth / 2.0 + hydrogenCountWidth, hy + this.opts.fontSizeSmall / 5.0);

            cursorPos += hydrogenWidth + hydrogenWidth / 2.0 + hydrogenCountWidth;
        }

        if (pseudoElementHandled) {
            ctx.restore();
            return;
        }

        for (let key in pseudoElements) {
            if (!pseudoElements.hasOwnProperty(key)) {
                continue;
            }

            let openParenthesisWidth = 0;
            let closeParenthesisWidth = 0;
            
            let element = pseudoElements[key].element;
            let elementCount = pseudoElements[key].count;
            let hydrogenCount = pseudoElements[key].hydrogenCount;

            ctx.font = this.fontLarge;

            if (elementCount > 1 && hydrogenCount > 0) {
                openParenthesisWidth = ctx.measureText('(').width;
                closeParenthesisWidth = ctx.measureText(')').width;
            }

            let elementWidth = ctx.measureText(element).width;
            let elementCountWidth = 0;

            hydrogenWidth = 0;

            if (hydrogenCount > 0) {
                hydrogenWidth = ctx.measureText('H').width;
            }

            ctx.font = this.fontSmall;

            if (elementCount > 1) {
                elementCountWidth = ctx.measureText(elementCount).width;
            }

            hydrogenCountWidth = 0;

            if (hydrogenCount > 1) {
                hydrogenCountWidth = ctx.measureText(hydrogenCount).width;
            }

            ctx.font = this.fontLarge;

            let hx = x + offsetX;
            let hy = y + offsetY + fontSizeLarge / 2.0;

            ctx.fillStyle = this.getColor(element);

            if (elementCount > 0) {
                cursorPosLeft -= elementCountWidth;
            }

            if (elementCount > 1 && hydrogenCount > 0) {
                if (direction === 'left') {
                    cursorPosLeft -= closeParenthesisWidth;
                    ctx.fillText(')', hx + cursorPosLeft, hy);
                } else {
                    ctx.fillText('(', hx + cursorPos, hy);
                    cursorPos += openParenthesisWidth;
                }
            }

            if (direction === 'left') {
                cursorPosLeft -= elementWidth;
                ctx.fillText(element, hx + cursorPosLeft, hy)
            } else {
                ctx.fillText(element, hx + cursorPos, hy)
                cursorPos += elementWidth;
            }

            if (hydrogenCount > 0) {
                if (direction === 'left') {
                    cursorPosLeft -= hydrogenWidth + hydrogenCountWidth;
                    ctx.fillText('H', hx + cursorPosLeft, hy)
                    
                    if (hydrogenCount > 1) {
                        ctx.font = this.fontSmall;
                        ctx.fillText(hydrogenCount, hx + cursorPosLeft + hydrogenWidth, hy + this.opts.fontSizeSmall / 5.0);
                    }
                } else {
                    ctx.fillText('H', hx + cursorPos, hy)
                    cursorPos += hydrogenWidth;

                    if (hydrogenCount > 1) {
                        ctx.font = this.fontSmall;
                        ctx.fillText(hydrogenCount, hx + cursorPos, hy + this.opts.fontSizeSmall / 5.0);
                        cursorPos += hydrogenCountWidth;
                    }
                }
            }

            ctx.font = this.fontLarge;

            if (elementCount > 1 && hydrogenCount > 0) {
                if (direction === 'left') {
                    cursorPosLeft -= openParenthesisWidth;
                    ctx.fillText('(', hx + cursorPosLeft, hy);
                } else {
                    ctx.fillText(')', hx + cursorPos, hy);
                    cursorPos += closeParenthesisWidth;
                }
            }
            
            ctx.font = this.fontSmall;

            if (elementCount > 1) {
                if (direction === 'left') {
                    ctx.fillText(elementCount, hx + cursorPosLeft + 
                                 openParenthesisWidth + closeParenthesisWidth + hydrogenWidth + 
                                 hydrogenCountWidth + elementWidth, hy + this.opts.fontSizeSmall / 5.0);
                } else {
                    ctx.fillText(elementCount, hx + cursorPos, hy + this.opts.fontSizeSmall / 5.0);
                    cursorPos += elementCountWidth;
                }
            }
        }

        ctx.restore();
    }

    /**
     * Draws a dubug dot at a given coordinate and adds text.
     *
     * @param {number} x The x coordinate.
     * @param {number} y The y coordindate.
     * @param {string} [debugText=''] A string.
     * @param {string} [color='#f00'] A color in hex form.
     */
    drawDebugPoint(x, y, debugText = '', color = '#f00') {
        this.drawCircle(x, y, 2, color, true, true, debugText);
    }

    /**
     * Draws a ring inside a provided ring, indicating aromaticity.
     *
     * @param {Ring} ring A ring.
     */
    drawAromaticityRing(ring) {
        let ctx = this.ctx;
        let radius = MathHelper.polyCircumradius(this.opts.bondLength, ring.getSize());

        ctx.save();
        ctx.strokeStyle = this.getColor('C');
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ring.center.x + this.offsetX, ring.center.y + this.offsetY, 
                radius - this.opts.bondLength / 3.0 - this.opts.bondSpacing, 0, Math.PI * 2, true); 
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    /**
     * Clear the canvas.
     *
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight);
    }

}