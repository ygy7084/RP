import React from 'react';
import {
    Link
} from 'react-router-dom';

class SideBar extends React.Component {
    render() {
        return (
            <div className='sidebar' style={style.sidebar}>
                <ul className="nav nav-sidebar">
                    <li><Link to="/">처음으로</Link></li>
                    <li><Link to="/setting/theater">공연장</Link></li>
                    <li><Link to="/setting/show">공연</Link></li>
                    <li><Link to="/setting/showtime">공연 일정</Link></li>
                    <li><Link to="/setting/reservation">예매 내역 엑셀 입력</Link></li>
                    <li><Link to="/setting/seats">좌석 정보</Link></li>
                    <li><Link to="/setting/image">공연장 좌석 이미지</Link></li>
                </ul>
            </div>
        )
    }
}
const style = {
    sidebar : {
        position : 'fixed',
        top : '10vh',
        width : '150px',
        zIndex : '1000',
        display : 'block'
    }
};

export default SideBar;