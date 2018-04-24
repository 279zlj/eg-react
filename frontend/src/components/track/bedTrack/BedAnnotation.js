import React from 'react';
import PropTypes from 'prop-types';

import TranslatableG from '../../TranslatableG';
import AnnotationArrows from '../commonComponents/annotation/AnnotationArrows';
import BackgroundedText from '../commonComponents/BackgroundedText';

import Feature from '../../../model/Feature';
import LinearDrawingModel from '../../../model/LinearDrawingModel';
import OpenInterval from '../../../model/interval/OpenInterval';
import { getContrastingColor } from '../../../util';

const HEIGHT = 9;

/**
 * Visualizer for Feature objects.
 * 
 * @author Silas Hsu
 */
class BedAnnotation extends React.Component {
    static HEIGHT = HEIGHT;

    static propTypes = {
        feature: PropTypes.instanceOf(Feature).isRequired, // Feature to visualize
        drawModel: PropTypes.instanceOf(LinearDrawingModel).isRequired, // Drawing model
        absLocation: PropTypes.instanceOf(OpenInterval).isRequired, // Location of the feature in navigation context
        y: PropTypes.number, // Y offset
        color: PropTypes.string, // Primary color to draw
        isMinimal: PropTypes.bool, // Whether to just render a plain box
        /**
         * Callback for click events.  Signature: (event: MouseEvent, feature: Feature): void
         *     `event`: the triggering click event
         *     `feature`: the same Feature as the one passed via props
         */
        onClick: PropTypes.func,
    };

    static defaultProps = {
        color: "blue",
        onClick: (event, feature) => undefined,
    };

    render() {
        const {feature, drawModel, absLocation, y, color, isMinimal, onClick} = this.props;
        const startX = Math.max(-1, drawModel.baseToX(absLocation.start));
        const endX = Math.min(drawModel.baseToX(absLocation.end), drawModel.getDrawWidth() + 1);
        const width = endX - startX;
        if (width < 0) {
            return null;
        }

        const mainBody = <rect x={startX} y={0} width={width} height={HEIGHT} fill={color} />;
        if (isMinimal) {
            return <TranslatableG y={y} onClick={event => onClick(event, feature)} >{mainBody}</TranslatableG>;
        }

        let arrows = null;
        if (feature.getIsForwardStrand() || feature.getIsReverseStrand()) {
            arrows = <AnnotationArrows
                startX={startX}
                endX={endX}
                height={HEIGHT}
                isToRight={feature.getIsForwardStrand()}
                color="white"
            />;
        }

        let label = null;
        const estimatedLabelWidth = feature.getName().length * HEIGHT;
        if (estimatedLabelWidth < 0.5 * width) {
            const centerX = startX + 0.5 * width;
            label = (
                <BackgroundedText
                    x={centerX}
                    y={0}
                    height={HEIGHT - 1}
                    fill={getContrastingColor(color)}
                    alignmentBaseline="hanging"
                    textAnchor="middle"
                    backgroundColor={color}
                    backgroundOpacity={1}
                >
                    {feature.getName()}
                </BackgroundedText>
            );
        }

        return (
        <TranslatableG y={y} onClick={event => onClick(event, feature)} >
            {mainBody}
            {arrows}
            {label}
        </TranslatableG>
        );
    }
}

export default BedAnnotation;
