This is a forked repo from [Smiles Drawer](https://github.com/reymond-group/smilesDrawer) version 1.2.0.

## How to build
run `gulp` under the root directory.

## Features Added

### Highlight the atoms (0.0.3) 
- call from code `smilesDrawer.draw(tree, "example-canvas", "light", false, [1, 2, 3], {0: "N", 1: "NW"})`
- define in canvas `<canvas id="example-canvas-3" width="500" height="500" data-vertex-highlights='{"1": "rgba(255, 0, 0, 0.5)"}'></canvas>`

### Change the positions of Numbering relative to vertices (0.0.2)
- call from code `smilesDrawer.draw(tree, "example-canvas", "light", false, [1, 2, 3], {0: "N", 1: "NW"})`
- define in canvas `<canvas id="example-canvas-3" width="500" height="500" data-smiles="Cc1cocc2CC=Cc12", data-numbering="[1,2,3,4,5,6,7,8,9,10]", data-numbering-directions='{"0": "N", "1": "NW", "2": "W", "3": "SW", "4": "S", "5": "SE", "6": "E", "7": "NE", "8": "S"}'></canvas>`

### Draw with Numbering (0.0.1)
- call from code `smilesDrawer.draw(tree, "example-canvas", "light", false, [1, 2, 3])`
- define in canvas `<canvas id="example-canvas-2" width="500" height="500" data-smiles="CC=OC", data-numbering="[3,4,5]"></canvas>`