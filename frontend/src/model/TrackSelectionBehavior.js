import _ from 'lodash';

class TrackSelectionBehavior {
    /**
     * @param {MouseEvent} event - mouse event to inspect
     * @return {boolean} whether the input event is one that requests a selection toggle
     */
    isToggleEvent(event) {
        return event.shiftKey;
    }

    handleClick(tracks, index, event) {
        if (this.isToggleEvent(event)) {
            const nextSelections = tracks.map(track => track.isSelected);
            nextSelections[index] = !nextSelections[index];
            return nextSelections;
        } else {
            return null;
        }
    }

    handleContextMenu(tracks, index) {
        if (tracks[index].isSelected) {
            return null;
        } else {
            const nextSelections = Array(tracks.length).fill(false);
            nextSelections[index] = true;
            return nextSelections;
        }
    }

    handleMetadataClick(tracks, index, term, event) {
        const termValue = tracks[index].getMetadata(term);
        // Find all adjacent tracks that have the same term value.  The result interval is [minIndex, maxIndex).
        // 1.  Find matching tracks before the clicked track
        let minIndex = index - 1;
        while (minIndex >= 0 && tracks[minIndex].getMetadata(term) === termValue) {
            minIndex--;
        }
        minIndex++;

        // 2.  Find matching tracks after the clicked track
        let maxIndex = index + 1;
        while (maxIndex < tracks.length && tracks[maxIndex].getMetadata(term) === termValue) {
            maxIndex++;
        }

        if (this.isToggleEvent(event)) {
            const nextSelections = tracks.map(track => track.isSelected);
            const isAlreadyAllSelected = tracks.slice(minIndex, maxIndex).every(track => track.isSelected);
            if (isAlreadyAllSelected) { // All selected?  Deselect the block.
                _.fill(nextSelections, false, minIndex, maxIndex);
            } else { // Some, or none selected?  Select the entire block.
                _.fill(nextSelections, true, minIndex, maxIndex);
            }
            return nextSelections;
        } else { // Event not a toggle-selection one: select the block and deselect all others
            const nextSelections = Array(tracks.length).fill(false);
            _.fill(nextSelections, true, minIndex, maxIndex);
            return nextSelections;
        }
    }
}

export default TrackSelectionBehavior;
