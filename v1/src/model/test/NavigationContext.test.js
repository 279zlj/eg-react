import NavigationContext from '../NavigationContext';
import { CHROMOSOMES } from './toyRegion';

const NAME = "Wow very genome";
const instance = new NavigationContext(NAME, CHROMOSOMES);

describe("Getters", () => {
    it("getName() is correct", () => {
        expect(instance.getName()).toBe(NAME);
    });

    it("getTotalBases() is correct", () => {
        expect(instance.getTotalBases()).toBe(30);
    });
});

describe("baseToSegmentCoordinate() and baseToSegmentIndex()", () => {
    it("returns the right info", () => {
        expect(instance.baseToSegmentCoordinate(10)).toEqual({
            name: "chr2",
            base: 1
        });
    });

    it("errors when given a base outside the genome", () => {
        expect(() => instance.baseToSegmentCoordinate(-1)).toThrow(RangeError);
        expect(() => instance.baseToSegmentCoordinate(100)).toThrow(RangeError);
    });
});

describe("parseRegionString() and segmentCoordinatesToBase()", () => {
    it("parses correctly", () => {
        expect(instance.parseRegionString("chr1:1-10")).toEqual({start: 0, end: 10});
        expect(instance.parseRegionString("chr1:10-chr3:1")).toEqual({start: 9, end: 21});
    });

    it("errors if given a nonsensical string", () => {
        expect(() => instance.parseRegionString("chr1:234s-130")).toThrow(RangeError);
    });

    it("errors if end base is before start base", () => {
        expect(() => instance.parseRegionString("chr1:10-1")).toThrow(RangeError);
        expect(() => instance.parseRegionString("chr2:1-chr1:5")).toThrow(RangeError);
    });

    it("errors if the chromosome doesn't exist", () => {
        expect(() => instance.parseRegionString("chr3:1-chr4:10")).toThrow(RangeError);
    });

    it("errors if the base pair is out of range", () => {
        expect(() => instance.parseRegionString("chr1:1-11")).toThrow(RangeError);
    });
});
