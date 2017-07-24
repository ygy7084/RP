import React from 'react';

class SideContents extends React.Component {
    render() {
        return (
            <div style={style.wrapper}>
                {this.props.children}
            </div>
        )
    }
}

const style = {
    wrapper : {
        marginLeft : '200px'
    }
};

export default SideContents;