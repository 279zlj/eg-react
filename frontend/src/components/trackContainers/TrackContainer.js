import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import connect from 'react-redux/lib/connect/connect';
import ReactModal from "react-modal";

import { ActionCreators } from '../../AppState';

import { withTrackData } from './TrackDataManager';
import { withTrackView } from './TrackViewManager';
import TrackHandle from './TrackHandle';
import { PannableTrackContainer } from './PannableTrackContainer';
import ReorderableTrackContainer from './ReorderableTrackContainer';
import { ZoomableTrackContainer } from './ZoomableTrackContainer';
import MetadataHeader from './MetadataHeader';
import { Tools, ToolButtons } from './Tools';

import OutsideClickDetector from '../OutsideClickDetector';
import ContextMenuManager from '../ContextMenuManager';
import DivWithBullseye from '../DivWithBullseye';
import withAutoDimensions from '../withAutoDimensions';
import TrackContextMenu from '../trackContextMenu/TrackContextMenu';

import TrackModel from '../../model/TrackModel';
import TrackSelectionBehavior from '../../model/TrackSelectionBehavior';
import DisplayedRegionModel from '../../model/DisplayedRegionModel';
import UndoRedo from "./UndoRedo";
import History from "./History";

import HighlightRegion from "../HighlightRegion";
import { VerticalDivider } from './VerticalDivider';
import { CircletView } from "./CircletView";

const DEFAULT_CURSOR = 'crosshair';
const SELECTION_BEHAVIOR = new TrackSelectionBehavior();


///////////
// HOC's //
///////////
function mapStateToProps(state) {
    return {
        genome: state.browser.present.genomeName,
        viewRegion: state.browser.present.viewRegion,
        tracks: state.browser.present.tracks,
        metadataTerms: state.browser.present.metadataTerms
    };
}

const callbacks = {
    onNewRegion: ActionCreators.setViewRegion,
    onTracksChanged: ActionCreators.setTracks,
    onMetadataTermsChanged: ActionCreators.setMetadataTerms,
};

const withAppState = connect(mapStateToProps, callbacks);
const withEnhancements = _.flowRight(withAppState, withAutoDimensions, withTrackView, withTrackData);

/**
 * Container for holding all the tracks, and an avenue for manipulating state common to all tracks.
 * 
 * @author Silas Hsu
 */
class TrackContainer extends React.Component {
    static propTypes = {
        tracks: PropTypes.arrayOf(PropTypes.instanceOf(TrackModel)).isRequired, // Tracks to render
        viewRegion: PropTypes.instanceOf(DisplayedRegionModel).isRequired,
        primaryView: PropTypes.object.isRequired,
        trackData: PropTypes.object.isRequired,
        metadataTerms: PropTypes.arrayOf(PropTypes.string).isRequired, // Metadata terms
        /**
         * Callback for when a new region is selected.  Signature:
         *     (newStart: number, newEnd: number): void
         *         `newStart`: the nav context coordinate of the start of the new view interval
         *         `newEnd`: the nav context coordinate of the end of the new view interval
         */
        onNewRegion: PropTypes.func,
        /**
         * Callback requesting a change in the track models.  Signature: (newModels: TrackModel[]): void
         */
        onTracksChanged: PropTypes.func,
        /**
         * Callback requesting a change in the metadata terms.  Signature: (newTerms: string[]): void
         */
        onMetadataTermsChanged: PropTypes.func,
        suggestedMetaSets: PropTypes.instanceOf(Set),
    };

    static defaultProps = {
        tracks: [],
        onNewRegion: () => undefined,
        onTracksChanged: () => undefined,
    };

    constructor(props) {
        super(props);
        this.state = {
            selectedTool: Tools.DRAG,
            xOffset: 0,
            showModal: false,
            trackForCircletView: null, // the trackmodel for circlet view
            circletColor: '#ff5722',
        };

        this.toggleTool = this.toggleTool.bind(this);
        this.handleTrackClicked = this.handleTrackClicked.bind(this);
        this.handleMetadataClicked = this.handleMetadataClicked.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);
        this.deselectAllTracks = this.deselectAllTracks.bind(this);
        this.changeXOffset = this.changeXOffset.bind(this);
        this.handleOpenModal = this.handleOpenModal.bind(this);
        this.handleCloseModal = this.handleCloseModal.bind(this);
        this.renderModal = this.renderModal.bind(this);
        this.setCircletColor = this.setCircletColor.bind(this);
    }

    /**
     * Toggles the selection of a tool, or switches tool.
     * 
     * @param {Tool} tool - tool to toggle or to switch to
     */
    toggleTool(tool) {
        if (this.state.selectedTool === tool) {
            this.setState({selectedTool: null});
        } else {
            this.setState({selectedTool: tool});
        }
    }

    changeXOffset(xOffset) {
        this.setState({xOffset});
    }

    handleOpenModal(track) {
        this.setState({ showModal: true, trackForCircletView: track });
    }
      
    handleCloseModal() {
        this.setState({ showModal: false, trackForCircletView: null });
    }

    setCircletColor(color) {
        this.setState({circletColor: color});
    }

    /**
     * 
     * @param {boolean[]} newSelections 
     */
    changeTrackSelection(newSelections) {
        if (!newSelections) {
            return;
        }
        const tracks = this.props.tracks;
        if (tracks.length !== newSelections.length) {
            console.error('Cannot apply track selection array with different length than existing tracks.');
            console.error(newSelections);
        }

        let wasTrackChanged = false;
        const nextTracks = tracks.map((track, i) => {
            if (track.isSelected !== newSelections[i]) {
                const clone = track.clone();
                clone.isSelected = newSelections[i];
                wasTrackChanged = true;
                return clone;
            } else {
                return track;
            }
        });

        if (wasTrackChanged) {
            this.props.onTracksChanged(nextTracks);
        }
    }

    /**
     * Handles selection behavior when a track is clicked.
     * 
     * @param {MouseEvent} event - click event
     * @param {number} index - index of the clicked track
     */
    handleTrackClicked(event, index) {
        this.changeTrackSelection(SELECTION_BEHAVIOR.handleClick(this.props.tracks, index, event));
    }

    /**
     * Handles selection behavior when a track's context menu is opened.
     * 
     * @param {MouseEvent} event - context menu event.  Unused.
     * @param {number} index - index of the track where the context menu event originated
     */
    handleContextMenu(event, index) {
        this.changeTrackSelection(SELECTION_BEHAVIOR.handleContextMenu(this.props.tracks, index));
    }

    /**
     * Handles selection behavior when a track's metadata indicator is clicked.
     * 
     * @param {MouseEvent} event - click event
     * @param {string} term - the metadata term that was clicked
     * @param {number} index - index of the clicked track
     */
    handleMetadataClicked(event, term, index) {
        this.changeTrackSelection(SELECTION_BEHAVIOR.handleMetadataClick(this.props.tracks, index, term, event));
    }

    /**
     * Requests deselection of all tracks.
     */
    deselectAllTracks() {
        this.changeTrackSelection(Array(this.props.tracks.length).fill(false));
    }

    // End callback methods
    ////////////////////
    // Render methods //
    ////////////////////
    /**
     * @return {JSX.Element}
     */
    renderControls() {
        const {metadataTerms, onMetadataTermsChanged, suggestedMetaSets} = this.props;
        // position: "-webkit-sticky", position: "sticky", top: 0, zIndex: 1, background: "white"
        return <div style={{display: "flex", alignItems: "flex-end"}}>
            <div>
                {/* <ZoomButtons viewRegion={viewRegion} onNewRegion={onNewRegion} /> */}
                <ToolButtons allTools={Tools} selectedTool={this.state.selectedTool} onToolClicked={this.toggleTool} /> 
            </div>
            <div><UndoRedo /></div>
            <div><History /></div>
            <MetadataHeader terms={metadataTerms} onNewTerms={onMetadataTermsChanged} suggestedMetaSets={suggestedMetaSets} />
        </div>;
    }

    /**
     * @return {JSX.Element[]} track elements to render
     */
    makeTrackElements() {
        const {tracks, trackData, primaryView, metadataTerms} = this.props;
        const trackElements = tracks.map((trackModel, index) => {
            const id = trackModel.getId();
            const data = trackData[id];
            return <TrackHandle
                key={trackModel.getId()}
                trackModel={trackModel}
                {...data}
                viewRegion={data.visRegion}
                width={primaryView.visWidth}
                viewWindow={primaryView.viewWindow}
                metadataTerms={metadataTerms}
                xOffset={0}
                index={index}
                onContextMenu={this.handleContextMenu}
                onClick={this.handleTrackClicked}
                onMetadataClick={this.handleMetadataClicked}
            />
        });
        return trackElements;
    }

    /**
     * Renders a subcontainer that provides specialized track manipulation, depending on the selected tool.
     * 
     * @return {JSX.Element} - subcontainer that renders tracks
     */
    renderSubContainer() {
        const {tracks, primaryView, onNewRegion, onTracksChanged} = this.props;
        const trackElements = this.makeTrackElements();
        switch (this.state.selectedTool) {
            case Tools.REORDER:
                return <ReorderableTrackContainer
                    trackElements={trackElements}
                    trackModels={tracks}
                    onTracksChanged={onTracksChanged}
                />;
            case Tools.ZOOM_IN:
                return <ZoomableTrackContainer
                    trackElements={trackElements}
                    visData={primaryView}
                    onNewRegion={onNewRegion}
                />;
            case Tools.DRAG:
                return <PannableTrackContainer
                    trackElements={trackElements}
                    visData={primaryView}
                    onNewRegion={onNewRegion}
                    xOffset={this.state.xOffset}
                    onXOffsetChanged={this.changeXOffset}
                />;
            default:
                return trackElements;
        }
    }

    renderModal() {
        const {primaryView, trackData} = this.props;
        const { trackForCircletView, circletColor } = this.state;
        return <ReactModal 
                isOpen={this.state.showModal}
                contentLabel="circlet-opener"
                ariaHideApp={false}
                >
                <button onClick={this.handleCloseModal}>Close</button>
                <CircletView 
                    primaryView={primaryView} 
                    trackData={trackData} 
                    track={trackForCircletView}
                    color={circletColor}
                    setCircletColor={this.setCircletColor}
                />
            </ReactModal>;
    }

    /**
     * @inheritdoc
     */
    render() {
        const {tracks, onTracksChanged, enteredRegion, highlightEnteredRegion, primaryView} = this.props;
        const { selectedTool } = this.state;
        const contextMenu = <TrackContextMenu 
                                tracks={tracks} 
                                onTracksChanged={onTracksChanged} 
                                deselectAllTracks={this.deselectAllTracks} 
                                onCircletRequested={this.handleOpenModal}
                            />;
        const trackDivStyle = {
                                border: "1px solid black", 
                                paddingBottom: "3px",
                                cursor: selectedTool ? selectedTool.cursor : DEFAULT_CURSOR
                            };
        return (
        <React.Fragment>
            <OutsideClickDetector onOutsideClick={this.deselectAllTracks} >
                {this.renderControls()}
                <ContextMenuManager menuElement={contextMenu} shouldMenuClose={event => !SELECTION_BEHAVIOR.isToggleEvent(event)} >
                    <DivWithBullseye style={trackDivStyle} id="trackContainer">
                        <VerticalDivider visData={primaryView}
                                xOffset={this.state.xOffset}>
                            <HighlightRegion 
                                enteredRegion={enteredRegion}
                                highlightEnteredRegion={highlightEnteredRegion}
                                visData={primaryView}
                                xOffset={this.state.xOffset}
                                >
                                {this.renderSubContainer()}
                            </HighlightRegion>
                        </VerticalDivider>
                    </DivWithBullseye>
                </ContextMenuManager>
            </OutsideClickDetector>
            {this.renderModal()}
        </React.Fragment>
        );
    }
}

export default withEnhancements(TrackContainer);
