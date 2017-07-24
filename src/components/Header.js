import React from 'react';
import {
    Link
} from 'react-router-dom';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';


class Header extends React.Component {
    constructor(props){
        super(props);
        this.state={
            date:undefined
        };
        this.datePicker_onChange = this.datePicker_onChange.bind(this);
        this.timePicker_onChange = this.timePicker_onChange.bind(this);
    }
    datePicker_onChange(date) {
        this.props.onDatePick(date.toDate());
        this.setState({
            date:date
        })
    }
    timePicker_onChange(e) {
        this.props.onTimePick(parseInt(e.target.value));
    }
    render() {
        return (
            <div style={style.header}>
                <div style={style.headerTitleWrapper}>
                    <h2 style={style.headerTitle}>
                        <Link to='/' style={style.headerTitleText}>{this.props.title}</Link>
                    </h2>
                </div>
                <div style={style.datetimeWrapper}>
                    <strong style={style.dateLabel}>공연일자</strong>
                    <DatePicker
                        selected={this.state.date}
                        onChange={this.datePicker_onChange}
                        dateFormat="YYYY/MM/DD"/>
                    <strong style={style.timeLabel}>공연회차</strong>
                    <select style={style.timeSelect} onChange={this.timePicker_onChange}>
                        {
                            this.props.Times ?
                                this.props.Times.map((t) => {
                                    return <option key={t.toString()} value={t.getTime()}>{t.toLocaleTimeString()}</option>
                                })
                                :
                                null
                        }
                    </select>
                </div>
            </div>
        )
    }
}

const style = {
    header:{
        paddingTop:'12px',
        paddingBottom:'40px',
        minWidth:'1120px',
        background:'linear-gradient(to bottom , rgb(26,42,87), rgb(37,60,126))',
        color:'white',
        width:'100%'
    },
    headerTitleWrapper:{
        float:'left',
        width:'60%'
    },
    headerTitle:{

        marginTop:'0',
        marginBottom:'0',
        width:'650px',
        margin:'auto'
    },
    headerTitleText:{
        color:'white',
        textDecoration:'none'
    },
    datetimeWrapper:{
        display:'inline-block',
        width:'40%',
        minWidth:'450px',
        position:'absolute'
    },
    dateLabel:{
        float:'left',
        marginTop:'5px',
        marginRight:'25px'
    },
    timeLabel:{
        float:'left',
        marginTop:'5px',
        marginLeft:'45px',
        marginRight:'25px'
    },
    timeSelect:{
        display:'inline-block',
        color:'black',
        width:'120px',
        height:'28px',
        paddingTop:'2px',
        paddingBottom:'2px'
    },
};


export default Header;