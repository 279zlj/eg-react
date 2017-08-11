import GenomeNavigatorComponent from './GenomeNavigatorComponent';

const HEIGHT = 20;
const BOUNDARY_LINE_EXTENT = 5;
const LABEL_OFFSET = 80;

class Chromosomes extends GenomeNavigatorComponent {
    redraw() {
        this.group.clear();

        let regionList = this.model.getRegionList();
        let x = 0;
        for (let region of regionList) {
            let width = this.basesToXWidth(region.end - region.start + 1);

            this.group.rect().attr({ // Rectangle for each chromosome
                width: width,
                height: HEIGHT,
                x: x,
                y: BOUNDARY_LINE_EXTENT,
                stroke: "#000",
                "stroke-width": 2,
                fill: "#fff"
            });

            if (x > 0) { // Thick line at boundaries of chromosomes (except the first one)
                let regionBoundaryLine = this.group.line(x, 0, x, BOUNDARY_LINE_EXTENT * 2 + HEIGHT);
                regionBoundaryLine.stroke({width: 4, color: '#000'});
            }

            let label = this.group.text(region.name); // Chromosome labels
            label.move(x + width/2, LABEL_OFFSET);
            label.font({
                anchor: 'middle',
                weight: 'bold',
            });

            x += width;
        }
    }
}

export default Chromosomes;