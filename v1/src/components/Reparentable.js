import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';

const store = {};

function getMountNode(uid) {
    if (!store[uid]) {
        store[uid] = {
            mountNode: document.createElement('div'),
            inUse: true
        };
    } else {
        store[uid].inUse = true;
    }

    return store[uid].mountNode;
}

function removeMountNode(uid) {
    const record = store[uid];

    record.inUse = false;

    setTimeout(() => {
        if (!store[uid].inUse) {
            ReactDOM.unmountComponentAtNode(store[uid].mountNode);
            delete store[uid];
        }
    }, 0);
}

/**
 * A component that does not remount (though it may still update and rerender) when it moves in the virtual DOM.  The
 * 'uid' prop keeps track of things.  To use correctly, ALL uids of concurrently mounted Reparentables in the ENTIRE app
 * must be unique.
 * 
 * Taken from https://gist.github.com/leoasis/e1d093141e5f22e4e1e346e6726dfa5b
 * 
 * (Added by Silas Hsu) - this component will also pass props to its children.
 * 
 * @author Leonardo Andrés Garcia Crespo
 * @author Silas Hsu
 */
export default class Reparentable extends React.Component {
    static propTypes = {
        uid: PropTypes.string.isRequired,
        children: PropTypes.element.isRequired
    }

    componentDidMount() {
        const mountNode = getMountNode(this.props.uid);
        this.el.appendChild(mountNode);

        this.renderChildrenIntoNode(mountNode);
    }

    componentDidUpdate() {
        const mountNode = getMountNode(this.props.uid);
        this.renderChildrenIntoNode(mountNode);
    }

    componentWillUnmount() {
        removeMountNode(this.props.uid);
    }

    renderChildrenIntoNode(node) {
        const {uid, children, ...otherProps} = this.props;
        // Merge props not specific to Reparentable into the children
        const childrenWithProps = React.Children.map(children, child => React.cloneElement(child, otherProps));

        // We use `unstable_renderSubtreeIntoContainer` instead of `render` because it also handles passing the context.
        ReactDOM.unstable_renderSubtreeIntoContainer(this, childrenWithProps, node);
    }

    render() {
        return <div ref={(el) => { this.el = el; }}></div>;
    }
}
