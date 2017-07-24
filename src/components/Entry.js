import React from 'react';

import {
    Link
} from 'react-router-dom';

class Entry extends React.Component {
    render() {
        return (
            <div className='container' style={style.vertical_center}>
                <div style={style.horizontal_center}>
                    <Link className='btn btn-primary btn-lg btn-block' to='/main'>발권</Link>
                    <Link className='btn btn-default btn-lg btn-block' to='/setting'>관리자</Link>
                </div>
            </div>
        )
    }
}

const style = {
    vertical_center : {
        height : '70vh',
        display : 'flex',
        alignItems : 'center'
    },
    horizontal_center : {
        margin : '0 auto',
        width : '40%'
    }
};

export default Entry;