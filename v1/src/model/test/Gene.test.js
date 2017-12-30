import makeToyRegion from './toyRegion';
import Gene from '../Gene';
import OpenInterval from '../interval/OpenInterval';
import FeatureInterval from '../interval/FeatureInterval';
import ChromosomeInterval from '../interval/ChromosomeInterval';

describe('Gene', () => {
    const INPUT = {
        chr: "chr2",
        start: 2,
        end: 4,
        details: `
            name: "GENE!",
            name2: "Jene",
            strand: "+",
            id: 12345,
            desc: "wow very gene",
            struct: {
                thick: [[2, 4]],
                thin: [[2, 4]]
            }
        `
    };

    let INSTANCE;
    beforeEach(() => {
        const navContext = makeToyRegion().getNavigationContext();
        const theFeature = navContext.getFeatures().find(feature => feature.getName() === "chr2");
        INSTANCE = new Gene(INPUT, navContext, new FeatureInterval(theFeature, 0, theFeature.getLength()));
    });

    it('constructs correctly', () => {
        expect(INSTANCE.getCoordinates()).toEqual(new ChromosomeInterval("chr2", 2, 4));
        expect([INSTANCE.absStart, INSTANCE.absEnd]).toEqual([12, 14]);
    });

    it('getIsInView() works correctly', () => {
        expect(INSTANCE.getIsInView(makeToyRegion(0, 10))).toBe(false);
        expect(INSTANCE.getIsInView(makeToyRegion(10, 20))).toBe(true);
    });

    it('getDetails() works correctly', () => {
        expect(INSTANCE.getDetails()).toEqual({
            name: "GENE!",
            name2: "Jene",
            strand: "+",
            id: 12345,
            desc: "wow very gene",
            struct: {
                thick: [[2, 4]],
                thin: [[2, 4]]
            },
            exons: [[2, 4]],
            absExons: [ new OpenInterval(12, 14) ],
        });
    });
});